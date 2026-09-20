import type { UIMessage } from "@ai-sdk/react";
import type { CustomEndpoint } from "../config";
import { runAgentStream, type AgentUsageDelta } from "./agent";
import type { ProviderKeys, CustomEndpointKeys } from "./keyring";
import { formatAiError } from "./errors";
import { native } from "./native";
import type { ToolContext } from "../tools/tools";

const ZYPERCODE_MD_MAX_BYTES = 32 * 1024;
type MemoryCacheEntry = { content: string | null; mtime: number };
const projectMemoryCache = new Map<string, MemoryCacheEntry>();

async function readProjectMemory(workspaceRoot: string | null): Promise<string | null> {
  if (!workspaceRoot) return null;
  const root = workspaceRoot.replace(/\/$/, "");
  const cached = projectMemoryCache.get(workspaceRoot);
  if (cached && Date.now() - cached.mtime < 30_000) return cached.content;
  try {
    let r = await native.readFile(`${root}/ZYPERCODE.md`).catch(() => null);
    if (!r || r.kind !== "text") {
      r = await native.readFile(`${root}/TERAX.md`).catch(() => null);
    }
    if (!r || r.kind !== "text") {
      projectMemoryCache.set(workspaceRoot, { content: null, mtime: Date.now() });
      return null;
    }
    const content =
      r.content.length > ZYPERCODE_MD_MAX_BYTES
        ? r.content.slice(0, ZYPERCODE_MD_MAX_BYTES)
        : r.content;
    projectMemoryCache.set(workspaceRoot, { content, mtime: Date.now() });
    return content;
  } catch {
    projectMemoryCache.set(workspaceRoot, { content: null, mtime: Date.now() });
    return null;
  }
}

type LiveSnapshot = {
  cwd: string | null;
  terminalPrivate: boolean;
  workspaceRoot: string | null;
  activeFile: string | null;
};

type Deps = {
  getKeys: () => ProviderKeys;
  toolContext: ToolContext;
  getModelId: () => string;
  getCustomInstructions: () => string;
  getAgentPersona: () => { name: string; instructions: string } | null;
  getLive: () => LiveSnapshot;
  getLmstudioBaseURL?: () => string | undefined;
  getLmstudioModelId?: () => string | undefined;
  getMlxBaseURL?: () => string | undefined;
  getMlxModelId?: () => string | undefined;
  getOllamaBaseURL?: () => string | undefined;
  getOllamaModelId?: () => string | undefined;
  getOpenaiCompatibleBaseURL?: () => string | undefined;
  getOpenaiCompatibleModelId?: () => string | undefined;
  getOpenaiCompatibleContextLimit?: () => number | undefined;
  getOpenrouterModelId?: () => string | undefined;
  getCustomEndpoints?: () => readonly CustomEndpoint[];
  getCustomEndpointKeys?: () => CustomEndpointKeys;
  onStep?: (step: string | null) => void;
  onUsage?: (delta: AgentUsageDelta) => void;
  onCompact?: (info: { droppedCount: number }) => void;
  onFinishMeta?: (info: { hitStepCap: boolean; finishReason: string }) => void;
  getPlanMode?: () => boolean;
};

type SendOptions = {
  messages: UIMessage[];
  abortSignal?: AbortSignal;
  [k: string]: unknown;
};

function isToolUnsupportedError(err: unknown): boolean {
  if (!err) return false;
  let str = "";
  if (typeof err === "string") {
    str = err;
  } else if (err instanceof Error) {
    str = `${err.name} ${err.message} ${String((err as { cause?: unknown }).cause ?? "")}`;
  } else if (typeof err === "object") {
    const rec = err as Record<string, unknown>;
    str = `${String(rec.errorText ?? "")} ${String(rec.error ?? "")} ${String(rec.message ?? "")} ${String(rec.details ?? "")}`;
    try {
      str += " " + JSON.stringify(err);
    } catch {
      /* ignore */
    }
  } else {
    str = String(err);
  }

  return (
    /support tool use/i.test(str) ||
    /tools? (are|is)? not supported/i.test(str) ||
    /does not support (tools?|function calling)/i.test(str) ||
    /try disabling ["']?\w+["']?/i.test(str) ||
    /no endpoints found that support/i.test(str) ||
    /tool_choice/i.test(str) ||
    /provider-selection/i.test(str) ||
    /read_file/i.test(str) ||
    /provider returned error/i.test(str) ||
    /failed after \d+ attempts/i.test(str) ||
    /\b502\b/i.test(str) ||
    /\b503\b/i.test(str) ||
    /bad gateway/i.test(str) ||
    /upstream error/i.test(str) ||
    /schema validation/i.test(str)
  );
}

export function createContextAwareTransport(deps: Deps) {
  const run = async (options: SendOptions) => {
    const live = deps.getLive();
    const projectMemory = await readProjectMemory(live.workspaceRoot);
    const envBlock = formatEnvBlock(live);
    const messagesForRun = envBlock
      ? injectEnvIntoLastUser(options.messages, envBlock)
      : options.messages;

    const createStream = async (
      disableTools: boolean,
      modelOverride?: { modelId?: string; openrouterModelId?: string },
    ) => {
      const result = await runAgentStream({
        keys: deps.getKeys(),
        modelId: modelOverride?.modelId ?? deps.getModelId(),
        customInstructions: deps.getCustomInstructions(),
        agentPersona: deps.getAgentPersona(),
        toolContext: deps.toolContext,
        onStep: deps.onStep,
        onUsage: deps.onUsage,
        onCompact: deps.onCompact,
        onFinishMeta: deps.onFinishMeta,
        lmstudioBaseURL: deps.getLmstudioBaseURL?.(),
        lmstudioModelId: deps.getLmstudioModelId?.(),
        mlxBaseURL: deps.getMlxBaseURL?.(),
        mlxModelId: deps.getMlxModelId?.(),
        ollamaBaseURL: deps.getOllamaBaseURL?.(),
        ollamaModelId: deps.getOllamaModelId?.(),
        openaiCompatibleBaseURL: deps.getOpenaiCompatibleBaseURL?.(),
        openaiCompatibleModelId: deps.getOpenaiCompatibleModelId?.(),
        openaiCompatibleContextLimit: deps.getOpenaiCompatibleContextLimit?.(),
        openrouterModelId:
          modelOverride?.openrouterModelId ?? deps.getOpenrouterModelId?.(),
        customEndpoints: deps.getCustomEndpoints?.(),
        customEndpointKeys: deps.getCustomEndpointKeys?.(),
        planMode: deps.getPlanMode?.(),
        projectMemory,
        uiMessages: messagesForRun,
        abortSignal: options.abortSignal,
        disableTools,
      });
      return result.toUIMessageStream({
        originalMessages: options.messages,
        onError: formatAiError,
      });
    };

    const tryStream = async (
      disableTools: boolean,
      modelOverride?: { modelId?: string; openrouterModelId?: string },
    ): Promise<{
      stream: ReadableStream<unknown>;
      isHealthy: boolean;
    }> => {
      const stream = await createStream(disableTools, modelOverride);
      const reader = stream.getReader();
      const buffered: unknown[] = [];

      while (true) {
        let res: ReadableStreamReadResult<unknown>;
        try {
          res = await reader.read();
        } catch (e) {
          try {
            await reader.cancel();
          } catch {}
          if (isToolUnsupportedError(e)) {
            return { stream, isHealthy: false };
          }
          throw e;
        }

        if (res.done) break;
        const val = res.value;
        if (isToolUnsupportedError(val)) {
          try {
            await reader.cancel();
          } catch {}
          return { stream, isHealthy: false };
        }

        buffered.push(val);
        const c = val as { type?: string };
        if (
          c?.type === "text-delta" ||
          c?.type === "tool-call" ||
          c?.type === "tool-call-streaming-start"
        ) {
          break;
        }
      }

      if (buffered.length === 0) {
        reader.releaseLock();
        return {
          stream: new ReadableStream({
            start(c) {
              c.close();
            },
          }),
          isHealthy: true,
        };
      }

      const rebuiltStream = new ReadableStream({
        async pull(controller) {
          if (buffered.length > 0) {
            controller.enqueue(buffered.shift());
            return;
          }
          try {
            const { done, value } = await reader.read();
            if (done) controller.close();
            else controller.enqueue(value);
          } catch (err) {
            controller.error(err);
          }
        },
        cancel(reason) {
          return reader.cancel(reason);
        },
      });

      return { stream: rebuiltStream, isHealthy: true };
    };

    // Tier 1: Try with current model and full tools
    try {
      const step1 = await tryStream(false);
      if (step1.isHealthy) return step1.stream;
    } catch (err) {
      if (!isToolUnsupportedError(err)) throw err;
    }

    // Tier 2: Try with current model in Direct Code Generation mode (disableTools: true)
    try {
      const step2 = await tryStream(true);
      if (step2.isHealthy) return step2.stream;
    } catch (err) {
      if (!isToolUnsupportedError(err)) throw err;
    }

    // Tier 3: If on OpenRouter and current model fails, attempt resilient fallback model
    const currentOpenrouterModel = deps.getOpenrouterModelId?.();
    if (deps.getModelId() === "openrouter-custom" && currentOpenrouterModel) {
      const fallbackOpenrouterModel =
        currentOpenrouterModel !== "meta-llama/llama-3.3-70b-instruct:free"
          ? "meta-llama/llama-3.3-70b-instruct:free"
          : "google/gemini-2.0-flash-exp:free";

      try {
        const step3 = await tryStream(true, {
          openrouterModelId: fallbackOpenrouterModel,
        });
        if (step3.isHealthy) return step3.stream;
      } catch {
        /* proceed to final throw */
      }
    }

    // Final fallback: invoke createStream directly so standard error handling formats any remaining issue
    return await createStream(true);
  };

  return {
    sendMessages: run,
    async reconnectToStream(): Promise<null> {
      return null;
    },
  };
}

function injectEnvIntoLastUser(
  messages: UIMessage[],
  envBlock: string,
): UIMessage[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const parts = m.parts as ReadonlyArray<{ type: string; text?: string }>;
    let textIdx = -1;
    for (let j = 0; j < parts.length; j++) {
      if (parts[j].type === "text") {
        textIdx = j;
        break;
      }
    }
    const nextParts =
      textIdx === -1
        ? [{ type: "text", text: envBlock }, ...parts]
        : parts.map((p, idx) =>
            idx === textIdx
              ? { ...p, text: `${envBlock}\n\n${p.text ?? ""}` }
              : p,
          );
    const out = messages.slice();
    out[i] = { ...m, parts: nextParts } as UIMessage;
    return out;
  }
  return messages;
}

function formatEnvBlock(live: LiveSnapshot): string | null {
  const lines: string[] = [];
  if (live.workspaceRoot) lines.push(`workspace_root: ${live.workspaceRoot}`);
  if (live.cwd) lines.push(`active_terminal_cwd: ${live.cwd}`);
  if (live.activeFile) lines.push(`active_file: ${live.activeFile}`);
  if (live.terminalPrivate) lines.push("active_terminal_mode: private");
  if (lines.length === 0) return null;
  return `<env>\n${lines.join("\n")}\n</env>`;
}

export const CONTEXT_BLOCK_RE =
  /^<terminal-context[^>]*>[\s\S]*?<\/terminal-context>\n*/;

export function stripContextBlock(text: string): string {
  return text.replace(CONTEXT_BLOCK_RE, "");
}

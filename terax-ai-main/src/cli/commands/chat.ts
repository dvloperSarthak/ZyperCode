import readline from "node:readline";
import {
  loadConfig,
  resolveApiKey,
  resolveProviderAndModel,
} from "../../config/index.ts";
import {
  chatWithFallback,
  getProvider,
  isProviderSupported,
  type Message,
  ProviderError,
  type ProviderTarget,
} from "../../providers/index.ts";

export interface ChatCommandOptions {
  providerOverride?: string;
  modelOverride?: string;
  prompt?: string;
}

export async function runChat(options: ChatCommandOptions = {}): Promise<void> {
  const { provider: primaryProviderId, model: primaryModel } =
    resolveProviderAndModel({
      providerOverride: options.providerOverride,
      modelOverride: options.modelOverride,
    });

  if (!isProviderSupported(primaryProviderId)) {
    console.error(
      `\x1b[31m✗ Unsupported provider: "${primaryProviderId}". Run: zypecode config\x1b[0m`,
    );
    return;
  }

  const config = loadConfig();
  const fallbackList = config.fallbacks || [];

  // Build target list: primary followed by fallbacks
  const targetProviders = [primaryProviderId, ...fallbackList.filter((f) => f !== primaryProviderId)];
  const targets: ProviderTarget[] = [];

  for (const pid of targetProviders) {
    if (!isProviderSupported(pid)) continue;
    const resolved = await resolveApiKey(pid);
    // Include if it has a key or if key is optional (e.g. openai-compatible)
    if (resolved.key || pid === "openai-compatible") {
      const p = getProvider(pid, {
        apiKey: resolved.key || undefined,
        baseURL:
          pid === "openai-compatible"
            ? config.openaiCompatible?.baseURL
            : undefined,
      });
      targets.push({
        provider: p,
        model: pid === primaryProviderId ? primaryModel : p.defaultModel,
      });
    }
  }

  if (targets.length === 0) {
    console.error(`\x1b[31m✗ API key not configured.\x1b[0m\n\nRun:\n  zypecode config\n`);
    return;
  }

  // If a prompt was supplied on command line, execute single-shot
  if (options.prompt && options.prompt.trim()) {
    await executePrompt(targets, options.prompt.trim());
    return;
  }

  // Otherwise, start interactive chat session
  await startInteractiveChat(targets, primaryModel);
}

async function executePrompt(
  targets: ProviderTarget[],
  promptText: string,
): Promise<void> {
  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are ZyperCode, a helpful AI coding and terminal assistant. Be concise and accurate.",
    },
    { role: "user", content: promptText },
  ];

  try {
    const response = await chatWithFallback(targets, messages, {
      onFallback(from, to, reason) {
        console.log(`\x1b[33m${from} unavailable (${reason}).\x1b[0m`);
        console.log(`\x1b[36mTrying ${to}...\x1b[0m`);
        console.log(`\x1b[32m✓ Connected.\x1b[0m\n`);
      },
    });

    console.log(`\n${response.text.trim()}\n`);
  } catch (err: unknown) {
    handleChatError(err);
  }
}

async function startInteractiveChat(
  targets: ProviderTarget[],
  primaryModel: string,
): Promise<void> {
  const primary = targets[0];
  console.log(`\n\x1b[1mZyperCode AI Chat\x1b[0m`);
  console.log(
    `Provider: \x1b[36m${primary.provider.name}\x1b[0m | Model: \x1b[36m${primaryModel}\x1b[0m`,
  );
  console.log(`Type your message and press Enter. Type \x1b[33mexit\x1b[0m to quit.\n`);

  const history: Message[] = [
    {
      role: "system",
      content:
        "You are ZyperCode, a helpful AI coding and terminal assistant. Be concise and accurate.",
    },
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = () => {
    rl.question("\x1b[1m\x1b[34mYou\x1b[0m > ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        promptUser();
        return;
      }
      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        rl.close();
        console.log("\nBye!\n");
        return;
      }

      history.push({ role: "user", content: trimmed });
      process.stdout.write("\n\x1b[1m\x1b[32mZyperCode\x1b[0m > Thinking...\r");

      try {
        const response = await chatWithFallback(targets, history, {
          onFallback(from, to, reason) {
            console.log(`\n\x1b[33m${from} unavailable (${reason}).\x1b[0m`);
            console.log(`\x1b[36mTrying ${to}...\x1b[0m`);
            console.log(`\x1b[32m✓ Connected.\x1b[0m`);
            process.stdout.write("\x1b[1m\x1b[32mZyperCode\x1b[0m > ");
          },
        });

        process.stdout.write("\r\x1b[K\x1b[1m\x1b[32mZyperCode\x1b[0m > ");
        console.log(response.text.trim());
        console.log();
        history.push({ role: "assistant", content: response.text });
      } catch (err: unknown) {
        console.log("\r\x1b[K");
        handleChatError(err);
      }

      promptUser();
    });
  };

  promptUser();
}

function handleChatError(err: unknown): void {
  if (err instanceof ProviderError) {
    if (err.errorCode === "AUTH_FAILED") {
      console.error(
        `\x1b[31m✗ Authentication failed.\x1b[0m\n\nCheck your API key with:\n  zypecode config key\n`,
      );
      return;
    }
    if (err.errorCode === "MODEL_UNAVAILABLE") {
      console.error(
        `\x1b[31m✗ Model unavailable.\x1b[0m\n\nRun:\n  zypecode models\n`,
      );
      return;
    }
    if (err.errorCode === "RATE_LIMITED" || err.errorCode === "QUOTA_EXHAUSTED") {
      console.error(
        `\x1b[31m✗ Provider capacity or quota exceeded (${err.message}).\x1b[0m\n`,
      );
      return;
    }
    console.error(`\x1b[31m✗ ${err.message}\x1b[0m\n`);
    return;
  }

  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\x1b[31m✗ Error: ${msg}\x1b[0m\n`);
}

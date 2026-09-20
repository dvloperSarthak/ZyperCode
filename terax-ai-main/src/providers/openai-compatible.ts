import { requestJson } from "./http.ts";
import type {
  AIProvider,
  AIResponse,
  ChatOptions,
  Message,
  Model,
  ProviderConfig,
  ValidationResult,
} from "./types.ts";
import { ProviderError } from "./types.ts";

export class OpenAICompatibleProvider implements AIProvider {
  readonly id = "openai-compatible";
  readonly name = "Custom OpenAI-compatible";
  readonly defaultModel: string;
  readonly supportsModelListing = true;

  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeoutMs: number;
  private readonly customHeaders: Record<string, string>;

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey ?? "";
    this.baseURL = (config.baseURL || "http://localhost:11434/v1").replace(
      /\/+$/,
      "",
    );
    this.defaultModel = config.defaultModel || "default";
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.customHeaders = config.customHeaders ?? {};
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.customHeaders,
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async chat(
    messages: Message[],
    options: ChatOptions = {},
  ): Promise<AIResponse> {
    if (!this.baseURL) {
      throw new ProviderError(
        "OpenAI-compatible Base URL is not configured. Run: zypecode config",
        {
          providerId: this.id,
          errorCode: "INVALID_REQUEST",
        },
      );
    }

    const model = options.model || this.defaultModel;
    const body: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }

    interface ChatCompletionResponse {
      choices?: Array<{
        message?: { content?: string };
        finish_reason?: string;
      }>;
      model?: string;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    }

    const data = await requestJson<ChatCompletionResponse>({
      url: `${this.baseURL}/chat/completions`,
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: this.timeoutMs,
      signal: options.signal,
      providerId: this.id,
    });

    const choice = data.choices?.[0];
    const text = choice?.message?.content ?? "";

    if (options.onToken && text) {
      options.onToken(text);
    }

    return {
      text,
      model: data.model || model,
      finishReason: choice?.finish_reason,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  }

  async listModels(): Promise<Model[]> {
    interface ModelItem {
      id: string;
      name?: string;
      description?: string;
      context_length?: number;
    }

    interface ModelsResponse {
      data?: ModelItem[];
    }

    try {
      const data = await requestJson<ModelsResponse>({
        url: `${this.baseURL}/models`,
        method: "GET",
        headers: this.getHeaders(),
        timeoutMs: this.timeoutMs,
        providerId: this.id,
      });

      if (!Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((item) => ({
        id: item.id,
        name: item.name || item.id,
        description: item.description,
        contextLength: item.context_length,
        isFree: false,
      }));
    } catch {
      // Not all custom OpenAI-compatible servers expose /models
      return [];
    }
  }

  async validateCredentials(model?: string): Promise<ValidationResult> {
    try {
      const testModel = model || this.defaultModel;
      await this.chat(
        [{ role: "user", content: "hi" }],
        { model: testModel, maxTokens: 1 },
      );
      return { valid: true, model: testModel };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { valid: false, error: message };
    }
  }
}

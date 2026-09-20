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

export class OpenRouterProvider implements AIProvider {
  readonly id = "openrouter";
  readonly name = "OpenRouter";
  readonly defaultModel = "meta-llama/llama-3.3-70b-instruct:free";
  readonly supportsModelListing = true;

  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeoutMs: number;
  private readonly customHeaders: Record<string, string>;

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey ?? "";
    this.baseURL = (config.baseURL ?? "https://openrouter.ai/api/v1").replace(
      /\/+$/,
      "",
    );
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.customHeaders = config.customHeaders ?? {};
  }

  private getHeaders(requireKey = true): Record<string, string> {
    if (requireKey && !this.apiKey) {
      throw new ProviderError("OpenRouter API key is not configured.", {
        providerId: this.id,
        errorCode: "AUTH_FAILED",
      });
    }
    const headers: Record<string, string> = {
      "HTTP-Referer": "https://zypecode.ai",
      "X-Title": "ZyperCode",
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

    interface OpenRouterChatResponse {
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

    const data = await requestJson<OpenRouterChatResponse>({
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
    interface OpenRouterModelItem {
      id: string;
      name?: string;
      description?: string;
      context_length?: number;
      pricing?: {
        prompt?: string | number;
        completion?: string | number;
      };
    }

    interface OpenRouterModelsResponse {
      data?: OpenRouterModelItem[];
    }

    const data = await requestJson<OpenRouterModelsResponse>({
      url: `${this.baseURL}/models`,
      method: "GET",
      headers: this.getHeaders(false),
      timeoutMs: this.timeoutMs,
      providerId: this.id,
    });

    if (!Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((item) => {
      const isFreePricing =
        item.pricing &&
        (item.pricing.prompt === 0 || item.pricing.prompt === "0") &&
        (item.pricing.completion === 0 || item.pricing.completion === "0");
      const isFree =
        item.id === "openrouter/free" ||
        item.id.endsWith(":free") ||
        Boolean(isFreePricing);

      return {
        id: item.id,
        name: item.name || item.id,
        description: item.description,
        contextLength: item.context_length,
        isFree,
      };
    });
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

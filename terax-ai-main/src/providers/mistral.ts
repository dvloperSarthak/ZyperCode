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

export class MistralProvider implements AIProvider {
  readonly id = "mistral";
  readonly name = "Mistral";
  readonly defaultModel = "mistral-small-latest";
  readonly supportsModelListing = true;

  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeoutMs: number;
  private readonly customHeaders: Record<string, string>;

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey ?? "";
    this.baseURL = (config.baseURL ?? "https://api.mistral.ai/v1").replace(
      /\/+$/,
      "",
    );
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.customHeaders = config.customHeaders ?? {};
  }

  private getHeaders(): Record<string, string> {
    if (!this.apiKey) {
      throw new ProviderError("Mistral API key is not configured.", {
        providerId: this.id,
        errorCode: "AUTH_FAILED",
      });
    }
    return {
      Authorization: `Bearer ${this.apiKey}`,
      ...this.customHeaders,
    };
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

    interface MistralChatResponse {
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

    const data = await requestJson<MistralChatResponse>({
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
    interface MistralModelItem {
      id: string;
      name?: string;
      description?: string;
      max_context_length?: number;
    }

    interface MistralModelsResponse {
      data?: MistralModelItem[];
    }

    const data = await requestJson<MistralModelsResponse>({
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
      contextLength: item.max_context_length,
      isFree: false,
    }));
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

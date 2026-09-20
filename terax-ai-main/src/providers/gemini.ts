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

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini";
  readonly defaultModel = "gemini-2.0-flash";
  readonly supportsModelListing = true;

  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeoutMs: number;
  private readonly customHeaders: Record<string, string>;

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey ?? "";
    this.baseURL = (
      config.baseURL ?? "https://generativelanguage.googleapis.com/v1beta"
    ).replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.customHeaders = config.customHeaders ?? {};
  }

  private getHeaders(): Record<string, string> {
    if (!this.apiKey) {
      throw new ProviderError("Gemini API key is not configured.", {
        providerId: this.id,
        errorCode: "AUTH_FAILED",
      });
    }
    return {
      "x-goog-api-key": this.apiKey,
      ...this.customHeaders,
    };
  }

  async chat(
    messages: Message[],
    options: ChatOptions = {},
  ): Promise<AIResponse> {
    let model = options.model || this.defaultModel;
    if (model.startsWith("models/")) {
      model = model.slice("models/".length);
    }

    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const contents = nonSystemMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
    };

    if (systemMessages.length > 0) {
      body.system_instruction = {
        parts: systemMessages.map((m) => ({ text: m.content })),
      };
    }

    const generationConfig: Record<string, unknown> = {};
    if (options.temperature !== undefined) {
      generationConfig.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      generationConfig.maxOutputTokens = options.maxTokens;
    }
    if (Object.keys(generationConfig).length > 0) {
      body.generationConfig = generationConfig;
    }

    interface GeminiCandidate {
      content?: {
        parts?: Array<{ text?: string }>;
      };
      finishReason?: string;
    }

    interface GeminiResponse {
      candidates?: GeminiCandidate[];
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    }

    const data = await requestJson<GeminiResponse>({
      url: `${this.baseURL}/models/${encodeURIComponent(model)}:generateContent`,
      method: "POST",
      headers: this.getHeaders(),
      body,
      timeoutMs: this.timeoutMs,
      signal: options.signal,
      providerId: this.id,
    });

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text ?? "";

    if (options.onToken && text) {
      options.onToken(text);
    }

    return {
      text,
      model,
      finishReason: candidate?.finishReason,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      },
    };
  }

  async listModels(): Promise<Model[]> {
    interface GeminiModelItem {
      name: string;
      displayName?: string;
      description?: string;
      inputTokenLimit?: number;
      supportedGenerationMethods?: string[];
    }

    interface GeminiModelsResponse {
      models?: GeminiModelItem[];
    }

    const data = await requestJson<GeminiModelsResponse>({
      url: `${this.baseURL}/models`,
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: this.timeoutMs,
      providerId: this.id,
    });

    if (!Array.isArray(data.models)) {
      return [];
    }

    return data.models
      .filter((m) =>
        m.supportedGenerationMethods
          ? m.supportedGenerationMethods.includes("generateContent")
          : true,
      )
      .map((item) => {
        const id = item.name.startsWith("models/")
          ? item.name.slice("models/".length)
          : item.name;

        return {
          id,
          name: item.displayName || id,
          description: item.description,
          contextLength: item.inputTokenLimit,
          isFree: false,
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

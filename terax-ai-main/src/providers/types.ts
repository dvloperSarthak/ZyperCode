export type MessageRole = "system" | "user" | "assistant";

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  stream?: boolean;
  onToken?: (token: string) => void;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AIResponse {
  text: string;
  model: string;
  usage?: TokenUsage;
  finishReason?: string;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  isFree?: boolean;
}

export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  defaultModel?: string;
  customHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  model?: string;
}

export type ErrorCode =
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "MODEL_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export class ProviderError extends Error {
  readonly providerId: string;
  readonly errorCode: ErrorCode;
  readonly statusCode?: number;
  readonly rawError?: unknown;

  constructor(
    message: string,
    options: {
      providerId: string;
      errorCode: ErrorCode;
      statusCode?: number;
      rawError?: unknown;
    },
  ) {
    super(message);
    this.name = "ProviderError";
    this.providerId = options.providerId;
    this.errorCode = options.errorCode;
    this.statusCode = options.statusCode;
    this.rawError = options.rawError;
  }

  isFallbackEligible(): boolean {
    return (
      this.errorCode === "RATE_LIMITED" ||
      this.errorCode === "QUOTA_EXHAUSTED" ||
      this.errorCode === "TIMEOUT" ||
      this.errorCode === "SERVER_ERROR" ||
      this.errorCode === "NETWORK_ERROR"
    );
  }
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly defaultModel: string;
  readonly supportsModelListing: boolean;

  chat(messages: Message[], options?: ChatOptions): Promise<AIResponse>;
  listModels?(): Promise<Model[]>;
  validateCredentials?(model?: string): Promise<ValidationResult>;
}

import {
  type AIProvider,
  type AIResponse,
  type ChatOptions,
  type Message,
  ProviderError,
} from "./types.ts";

export interface ProviderTarget {
  provider: AIProvider;
  model?: string;
}

export interface FallbackOptions extends ChatOptions {
  onFallback?: (
    fromProvider: string,
    toProvider: string,
    reason: string,
  ) => void;
  allowAuthFallback?: boolean;
}

export async function chatWithFallback(
  targets: ProviderTarget[],
  messages: Message[],
  options: FallbackOptions = {},
): Promise<AIResponse> {
  if (targets.length === 0) {
    throw new ProviderError("No AI providers configured.", {
      providerId: "system",
      errorCode: "INVALID_REQUEST",
    });
  }

  let lastError: unknown;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const isLast = i === targets.length - 1;

    try {
      const response = await target.provider.chat(messages, {
        ...options,
        model: target.model || options.model,
      });
      return response;
    } catch (err: unknown) {
      lastError = err;

      if (err instanceof ProviderError) {
        // Do NOT fallback on authentication failure unless explicitly allowed
        if (err.errorCode === "AUTH_FAILED" && !options.allowAuthFallback) {
          throw err;
        }

        // Check if error qualifies for automatic fallback
        if (err.isFallbackEligible() && !isLast) {
          const nextTarget = targets[i + 1];
          const reason = formatFallbackReason(err);
          if (options.onFallback) {
            options.onFallback(
              target.provider.name,
              nextTarget.provider.name,
              reason,
            );
          }
          continue;
        }
      }

      // If not eligible or last provider, throw
      throw err;
    }
  }

  throw lastError;
}

function formatFallbackReason(err: ProviderError): string {
  switch (err.errorCode) {
    case "RATE_LIMITED":
      return "rate limit";
    case "QUOTA_EXHAUSTED":
      return "quota exhausted";
    case "TIMEOUT":
      return "timeout";
    case "SERVER_ERROR":
      return "temporary server error";
    case "NETWORK_ERROR":
      return "connection error";
    default:
      return "service unavailable";
  }
}

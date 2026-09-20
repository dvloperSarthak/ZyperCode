import { type ErrorCode, ProviderError } from "./types.ts";

export interface RequestOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  providerId: string;
}

export function sanitizeHeaders(
  headers?: Record<string, string>,
): Record<string, string> {
  if (!headers) return {};
  const sanitized: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (
      k.toLowerCase() === "authorization" ||
      k.toLowerCase() === "x-api-key" ||
      k.toLowerCase() === "api-key"
    ) {
      sanitized[k] = "[REDACTED]";
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export async function requestJson<T>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = "GET",
    headers = {},
    body,
    timeoutMs = 30000,
    signal,
    providerId,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const combinedSignal = signal
    ? anySignal([signal, controller.signal])
    : controller.signal;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorBody: unknown;
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        errorBody = await res.json();
        if (typeof errorBody === "object" && errorBody !== null) {
          const errObj = (errorBody as { error?: { message?: string } | string })
            .error;
          if (typeof errObj === "string") {
            errorMsg = errObj;
          } else if (errObj && typeof errObj.message === "string") {
            errorMsg = errObj.message;
          }
        }
      } catch {
        // failed to parse json error body
      }

      const errorCode = mapStatusToErrorCode(res.status, errorMsg);
      throw new ProviderError(cleanErrorMessage(errorMsg), {
        providerId,
        errorCode,
        statusCode: res.status,
        rawError: errorBody,
      });
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ProviderError) {
      throw err;
    }

    if (
      (err as { name?: string }).name === "AbortError" ||
      (err as { name?: string }).name === "TimeoutError"
    ) {
      throw new ProviderError(`Request timed out after ${timeoutMs}ms`, {
        providerId,
        errorCode: "TIMEOUT",
      });
    }

    const message =
      err instanceof Error ? err.message : "Network or connection error";
    throw new ProviderError(`Network error: ${cleanErrorMessage(message)}`, {
      providerId,
      errorCode: "NETWORK_ERROR",
      rawError: err,
    });
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort();
      return controller.signal;
    }
    sig.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

function mapStatusToErrorCode(status: number, message: string): ErrorCode {
  const lower = message.toLowerCase();
  if (status === 401 || status === 403) return "AUTH_FAILED";
  if (status === 429) {
    if (lower.includes("quota") || lower.includes("insufficient")) {
      return "QUOTA_EXHAUSTED";
    }
    return "RATE_LIMITED";
  }
  if (lower.includes("quota") || lower.includes("credit")) {
    return "QUOTA_EXHAUSTED";
  }
  if (status === 404) return "MODEL_UNAVAILABLE";
  if (status >= 500) return "SERVER_ERROR";
  if (status >= 400) return "INVALID_REQUEST";
  return "UNKNOWN";
}

function cleanErrorMessage(msg: string): string {
  // Strip any accidental bearer tokens or raw sensitive strings
  return msg
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/key=[A-Za-z0-9_\-\.]+/gi, "key=[REDACTED]");
}

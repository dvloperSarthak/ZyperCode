import { describe, expect, it, vi } from "vitest";
import { chatWithFallback } from "./fallback.ts";
import { type AIProvider, type AIResponse, ProviderError } from "./types.ts";

function createMockProvider(
  id: string,
  name: string,
  chatFn: () => Promise<AIResponse>,
): AIProvider {
  return {
    id,
    name,
    defaultModel: "default-model",
    supportsModelListing: false,
    chat: vi.fn().mockImplementation(chatFn),
  };
}

describe("Automatic Provider Fallback", () => {
  it("uses primary provider when successful", async () => {
    const primary = createMockProvider("openrouter", "OpenRouter", async () => ({
      text: "Success from OpenRouter",
      model: "test-model",
    }));
    const fallback = createMockProvider("groq", "Groq", async () => ({
      text: "Success from Groq",
      model: "groq-model",
    }));

    const res = await chatWithFallback(
      [{ provider: primary }, { provider: fallback }],
      [{ role: "user", content: "hello" }],
    );

    expect(res.text).toBe("Success from OpenRouter");
    expect(primary.chat).toHaveBeenCalledTimes(1);
    expect(fallback.chat).not.toHaveBeenCalled();
  });

  it("automatically falls back on rate limit (429)", async () => {
    const primary = createMockProvider("openrouter", "OpenRouter", async () => {
      throw new ProviderError("Rate limit exceeded", {
        providerId: "openrouter",
        errorCode: "RATE_LIMITED",
        statusCode: 429,
      });
    });
    const fallback = createMockProvider("groq", "Groq", async () => ({
      text: "Response from fallback Groq",
      model: "groq-model",
    }));

    const onFallback = vi.fn();

    const res = await chatWithFallback(
      [{ provider: primary }, { provider: fallback }],
      [{ role: "user", content: "hello" }],
      { onFallback },
    );

    expect(res.text).toBe("Response from fallback Groq");
    expect(primary.chat).toHaveBeenCalledTimes(1);
    expect(fallback.chat).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith(
      "OpenRouter",
      "Groq",
      "rate limit",
    );
  });

  it("automatically falls back on temporary server error (503)", async () => {
    const primary = createMockProvider("openrouter", "OpenRouter", async () => {
      throw new ProviderError("Service unavailable", {
        providerId: "openrouter",
        errorCode: "SERVER_ERROR",
        statusCode: 503,
      });
    });
    const fallback = createMockProvider("mistral", "Mistral", async () => ({
      text: "Response from Mistral",
      model: "mistral-model",
    }));

    const onFallback = vi.fn();

    const res = await chatWithFallback(
      [{ provider: primary }, { provider: fallback }],
      [{ role: "user", content: "hello" }],
      { onFallback },
    );

    expect(res.text).toBe("Response from Mistral");
    expect(onFallback).toHaveBeenCalledWith(
      "OpenRouter",
      "Mistral",
      "temporary server error",
    );
  });

  it("does NOT fall back on authentication error (401/403)", async () => {
    const primary = createMockProvider("openrouter", "OpenRouter", async () => {
      throw new ProviderError("Invalid API key", {
        providerId: "openrouter",
        errorCode: "AUTH_FAILED",
        statusCode: 401,
      });
    });
    const fallback = createMockProvider("groq", "Groq", async () => ({
      text: "Should not reach here",
      model: "groq-model",
    }));

    const onFallback = vi.fn();

    await expect(
      chatWithFallback(
        [{ provider: primary }, { provider: fallback }],
        [{ role: "user", content: "hello" }],
        { onFallback },
      ),
    ).rejects.toThrow("Invalid API key");

    expect(fallback.chat).not.toHaveBeenCalled();
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("cascades through multiple fallbacks until finding a successful one", async () => {
    const p1 = createMockProvider("p1", "Provider 1", async () => {
      throw new ProviderError("Rate limit", {
        providerId: "p1",
        errorCode: "RATE_LIMITED",
      });
    });
    const p2 = createMockProvider("p2", "Provider 2", async () => {
      throw new ProviderError("Timeout", {
        providerId: "p2",
        errorCode: "TIMEOUT",
      });
    });
    const p3 = createMockProvider("p3", "Provider 3", async () => ({
      text: "Provider 3 response",
      model: "p3-model",
    }));

    const fallbacksLog: Array<{ from: string; to: string; reason: string }> = [];

    const res = await chatWithFallback(
      [{ provider: p1 }, { provider: p2 }, { provider: p3 }],
      [{ role: "user", content: "hello" }],
      {
        onFallback(from, to, reason) {
          fallbacksLog.push({ from, to, reason });
        },
      },
    );

    expect(res.text).toBe("Provider 3 response");
    expect(fallbacksLog).toEqual([
      { from: "Provider 1", to: "Provider 2", reason: "rate limit" },
      { from: "Provider 2", to: "Provider 3", reason: "timeout" },
    ]);
  });
});

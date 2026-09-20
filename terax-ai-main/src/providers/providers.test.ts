import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiProvider } from "./gemini.ts";
import { GroqProvider } from "./groq.ts";
import {
  getProvider,
  isProviderSupported,
  listSupportedProviders,
  registerProvider,
} from "./index.ts";
import { MistralProvider } from "./mistral.ts";
import { OpenAICompatibleProvider } from "./openai-compatible.ts";
import { OpenRouterProvider } from "./openrouter.ts";
import { ProviderError } from "./types.ts";

describe("AI Providers", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("Provider Registry & Initialization", () => {
    it("recognizes all default providers", () => {
      expect(isProviderSupported("openrouter")).toBe(true);
      expect(isProviderSupported("mistral")).toBe(true);
      expect(isProviderSupported("gemini")).toBe(true);
      expect(isProviderSupported("groq")).toBe(true);
      expect(isProviderSupported("openai-compatible")).toBe(true);
      expect(isProviderSupported("unknown-provider")).toBe(false);
    });

    it("lists metadata for all supported providers", () => {
      const list = listSupportedProviders();
      const ids = list.map((p) => p.id);
      expect(ids).toContain("openrouter");
      expect(ids).toContain("mistral");
      expect(ids).toContain("gemini");
      expect(ids).toContain("groq");
      expect(ids).toContain("openai-compatible");
    });

    it("instantiates provider with custom config", () => {
      const p = getProvider("openrouter", { apiKey: "test-key" });
      expect(p.id).toBe("openrouter");
      expect(p.name).toBe("OpenRouter");
    });

    it("allows registering new custom providers dynamically", () => {
      registerProvider("custom-ai", () => ({
        id: "custom-ai",
        name: "Custom AI",
        defaultModel: "custom-v1",
        supportsModelListing: false,
        chat: vi.fn(),
      }));

      expect(isProviderSupported("custom-ai")).toBe(true);
      const custom = getProvider("custom-ai");
      expect(custom.name).toBe("Custom AI");
    });

    it("throws ProviderError for unknown provider", () => {
      expect(() => getProvider("non-existent")).toThrow(ProviderError);
    });
  });

  describe("OpenRouter Provider", () => {
    it("formats chat requests and parses responses correctly", async () => {
      const mockResponse = {
        choices: [{ message: { content: "Hello from OpenRouter" }, finish_reason: "stop" }],
        model: "qwen/qwen3-coder:free",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OpenRouterProvider({ apiKey: "sk-or-test" });
      const res = await provider.chat([{ role: "user", content: "hi" }]);

      expect(res.text).toBe("Hello from OpenRouter");
      expect(res.model).toBe("qwen/qwen3-coder:free");
      expect(res.usage?.totalTokens).toBe(15);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer sk-or-test",
            "HTTP-Referer": "https://zypecode.ai",
            "X-Title": "ZyperCode",
          }),
        }),
      );
    });

    it("lists models and correctly identifies free models dynamically", async () => {
      const mockModels = {
        data: [
          { id: "meta-llama/llama-3:free", name: "Llama 3 Free", pricing: { prompt: "0", completion: "0" } },
          { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", pricing: { prompt: "0.000003", completion: "0.000015" } },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockModels,
      });

      const provider = new OpenRouterProvider({ apiKey: "sk-or-test" });
      const models = await provider.listModels();

      expect(models.length).toBe(2);
      expect(models[0].isFree).toBe(true);
      expect(models[1].isFree).toBe(false);
    });

    it("throws AUTH_FAILED ProviderError when API key is missing", async () => {
      const provider = new OpenRouterProvider({ apiKey: "" });
      await expect(
        provider.chat([{ role: "user", content: "hi" }]),
      ).rejects.toThrow(ProviderError);
    });
  });

  describe("Mistral Provider", () => {
    it("handles chat requests with mistral headers", async () => {
      const mockResponse = {
        choices: [{ message: { content: "Mistral response" }, finish_reason: "stop" }],
        model: "mistral-small-latest",
        usage: { prompt_tokens: 8, completion_tokens: 4, total_tokens: 12 },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new MistralProvider({ apiKey: "test-mistral-key" });
      const res = await provider.chat([{ role: "user", content: "hello" }]);

      expect(res.text).toBe("Mistral response");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.mistral.ai/v1/chat/completions",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-mistral-key",
          }),
        }),
      );
    });

    it("lists mistral models", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: "mistral-small-latest", name: "Mistral Small" }],
        }),
      });

      const provider = new MistralProvider({ apiKey: "test-mistral-key" });
      const models = await provider.listModels();
      expect(models.length).toBe(1);
      expect(models[0].id).toBe("mistral-small-latest");
    });
  });

  describe("Google Gemini Provider", () => {
    it("formats generateContent requests and handles system instruction", async () => {
      const mockResponse = {
        candidates: [
          {
            content: { parts: [{ text: "Gemini answer" }] },
            finishReason: "STOP",
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 6,
          totalTokenCount: 21,
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new GeminiProvider({ apiKey: "gemini-test-key" });
      const res = await provider.chat([
        { role: "system", content: "You are helpful" },
        { role: "user", content: "Hello Gemini" },
      ]);

      expect(res.text).toBe("Gemini answer");
      expect(res.usage?.totalTokens).toBe(21);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "x-goog-api-key": "gemini-test-key",
          }),
        }),
      );
    });

    it("lists gemini models stripping models/ prefix", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            {
              name: "models/gemini-2.0-flash",
              displayName: "Gemini 2.0 Flash",
              supportedGenerationMethods: ["generateContent"],
            },
          ],
        }),
      });

      const provider = new GeminiProvider({ apiKey: "gemini-test-key" });
      const models = await provider.listModels();
      expect(models.length).toBe(1);
      expect(models[0].id).toBe("gemini-2.0-flash");
      expect(models[0].name).toBe("Gemini 2.0 Flash");
    });
  });

  describe("Groq Provider", () => {
    it("handles groq chat completions", async () => {
      const mockResponse = {
        choices: [{ message: { content: "Groq response" }, finish_reason: "stop" }],
        model: "llama-3.3-70b-versatile",
        usage: { prompt_tokens: 12, completion_tokens: 6, total_tokens: 18 },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new GroqProvider({ apiKey: "gsk_test123" });
      const res = await provider.chat([{ role: "user", content: "Hello Groq" }]);

      expect(res.text).toBe("Groq response");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.groq.com/openai/v1/chat/completions",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer gsk_test123",
          }),
        }),
      );
    });
  });

  describe("OpenAI-Compatible Custom Provider", () => {
    it("supports custom baseURL and optional API key", async () => {
      const mockResponse = {
        choices: [{ message: { content: "Local model answer" } }],
        model: "qwen2.5-coder",
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new OpenAICompatibleProvider({
        baseURL: "http://localhost:11434/v1",
        defaultModel: "qwen2.5-coder",
      });

      const res = await provider.chat([{ role: "user", content: "hello" }]);
      expect(res.text).toBe("Local model answer");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:11434/v1/chat/completions",
        expect.anything(),
      );
    });

    it("gracefully returns empty list if models endpoint is unsupported", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const provider = new OpenAICompatibleProvider({
        baseURL: "http://localhost:11434/v1",
      });
      const models = await provider.listModels();
      expect(models).toEqual([]);
    });
  });

  describe("Error Mapping & Classification", () => {
    it("classifies 401 as AUTH_FAILED", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: { message: "Invalid API key" } }),
      });

      const provider = new GroqProvider({ apiKey: "invalid-key" });
      try {
        await provider.chat([{ role: "user", content: "test" }]);
        expect.unreachable("Should have thrown");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ProviderError);
        const pErr = err as ProviderError;
        expect(pErr.errorCode).toBe("AUTH_FAILED");
        expect(pErr.isFallbackEligible()).toBe(false);
      }
    });

    it("classifies 429 as RATE_LIMITED or QUOTA_EXHAUSTED", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({ error: { message: "Rate limit exceeded" } }),
      });

      const provider = new OpenRouterProvider({ apiKey: "test-key" });
      try {
        await provider.chat([{ role: "user", content: "test" }]);
        expect.unreachable("Should have thrown");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ProviderError);
        const pErr = err as ProviderError;
        expect(pErr.errorCode).toBe("RATE_LIMITED");
        expect(pErr.isFallbackEligible()).toBe(true);
      }
    });

    it("classifies 503 as SERVER_ERROR", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({ error: "Overloaded" }),
      });

      const provider = new MistralProvider({ apiKey: "test-key" });
      try {
        await provider.chat([{ role: "user", content: "test" }]);
        expect.unreachable("Should have thrown");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ProviderError);
        const pErr = err as ProviderError;
        expect(pErr.errorCode).toBe("SERVER_ERROR");
        expect(pErr.isFallbackEligible()).toBe(true);
      }
    });
  });
});

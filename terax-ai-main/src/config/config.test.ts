import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getConfigPath, loadConfig, saveConfig } from "./config.ts";
import {
  deleteApiKey,
  getApiKey,
  maskApiKey,
  setApiKey,
} from "./credentials.ts";
import { getEnvApiKey, resolveApiKey, resolveProviderAndModel } from "./env.ts";

describe("Configuration and Secure Credentials", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Config JSON Management", () => {
    it("returns default config when no custom config exists", () => {
      const cfg = loadConfig();
      expect(cfg.provider).toBeDefined();
      expect(cfg.model).toBeDefined();
    });

    it("saves updates without persisting API keys or secrets", () => {
      saveConfig({
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        apiKey: "SHOULD_NOT_BE_SAVED",
        secret: "ALSO_STRIPPED",
      } as Record<string, unknown>);

      const cfg = loadConfig();
      expect(cfg.provider).toBe("groq");
      expect(cfg.model).toBe("llama-3.3-70b-versatile");
      expect(((cfg as unknown) as Record<string, unknown>).apiKey).toBeUndefined();
      expect(((cfg as unknown) as Record<string, unknown>).secret).toBeUndefined();

      // Read raw file to double check
      const raw = fs.readFileSync(getConfigPath(), "utf8");
      expect(raw).not.toContain("SHOULD_NOT_BE_SAVED");
      expect(raw).not.toContain("apiKey");
    });
  });

  describe("Secure Credential Store & Key Masking", () => {
    it("masks API keys with prefixes and trailing characters safely", () => {
      expect(maskApiKey("sk-or-v1-abcdef1234567890")).toBe("sk-or-v1-...7890");
      expect(maskApiKey("gsk_123456789abcdef")).toBe("gsk_...cdef");
      expect(maskApiKey("sk-1234567890")).toBe("sk-...7890");
      expect(maskApiKey("short")).toBe("••••••••");
      expect(maskApiKey("")).toBe("(not configured)");
      expect(maskApiKey(null)).toBe("(not configured)");
    });

    it("stores and encrypts API keys securely and decrypts on retrieval", async () => {
      await setApiKey("test-provider", "secret-test-key-12345");
      const retrieved = await getApiKey("test-provider");
      expect(retrieved).toBe("secret-test-key-12345");

      // Verify that raw credentials file does not contain plain text key
      const credFile = path.join(os.homedir(), ".zypecode", "credentials");
      if (fs.existsSync(credFile)) {
        const raw = fs.readFileSync(credFile, "utf8");
        expect(raw).not.toContain("secret-test-key-12345");
      }

      await deleteApiKey("test-provider");
      const afterDelete = await getApiKey("test-provider");
      expect(afterDelete).toBeNull();
    });
  });

  describe("Environment Variables & Precedence", () => {
    it("reads provider-specific environment variables", () => {
      process.env.OPENROUTER_API_KEY = "sk-or-env-test";
      expect(getEnvApiKey("openrouter")).toBe("sk-or-env-test");

      process.env.MISTRAL_API_KEY = "mistral-env-test";
      expect(getEnvApiKey("mistral")).toBe("mistral-env-test");

      process.env.GEMINI_API_KEY = "gemini-env-test";
      expect(getEnvApiKey("gemini")).toBe("gemini-env-test");

      process.env.GROQ_API_KEY = "groq-env-test";
      expect(getEnvApiKey("groq")).toBe("groq-env-test");
    });

    it("enforces resolution precedence: flag > env > store", async () => {
      process.env.OPENROUTER_API_KEY = "env-key";
      await setApiKey("openrouter", "store-key");

      // 1. Explicit flag wins
      const resFlag = await resolveApiKey("openrouter", "explicit-key");
      expect(resFlag.key).toBe("explicit-key");
      expect(resFlag.source).toBe("flag");

      // 2. Env variable beats stored key
      const resEnv = await resolveApiKey("openrouter");
      expect(resEnv.key).toBe("env-key");
      expect(resEnv.source).toBe("env");

      // 3. Stored key is used when env var is absent
      delete process.env.OPENROUTER_API_KEY;
      const resStore = await resolveApiKey("openrouter");
      expect(resStore.key).toBe("store-key");
      expect(resStore.source).toBe("store");
    });

    it("resolves provider and model overrides with flag precedence", () => {
      process.env.ZYPECODE_PROVIDER = "mistral";
      process.env.ZYPECODE_MODEL = "mistral-large";

      const res = resolveProviderAndModel({
        providerOverride: "groq",
        modelOverride: "llama-3",
      });

      expect(res.provider).toBe("groq");
      expect(res.model).toBe("llama-3");
      expect(res.providerSource).toBe("flag");
      expect(res.modelSource).toBe("flag");
    });
  });
});

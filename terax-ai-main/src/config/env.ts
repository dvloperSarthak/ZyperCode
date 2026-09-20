import { loadConfig } from "./config.ts";
import { getApiKey } from "./credentials.ts";
import { DEFAULT_CONFIG } from "./types.ts";

export interface ResolvedKey {
  key: string | null;
  source: "flag" | "env" | "store" | "none";
  envVarName?: string;
}

export function getEnvVarNameForProvider(provider: string): string | null {
  switch (provider.toLowerCase()) {
    case "openrouter":
      return "OPENROUTER_API_KEY";
    case "mistral":
      return "MISTRAL_API_KEY";
    case "gemini":
      return "GEMINI_API_KEY";
    case "groq":
      return "GROQ_API_KEY";
    case "openai-compatible":
      return "OPENAI_COMPATIBLE_API_KEY";
    default:
      return null;
  }
}

export function getEnvApiKey(provider: string): string | null {
  const norm = provider.toLowerCase();
  if (norm === "openrouter") {
    return process.env.OPENROUTER_API_KEY?.trim() || null;
  }
  if (norm === "mistral") {
    return process.env.MISTRAL_API_KEY?.trim() || null;
  }
  if (norm === "gemini") {
    return (
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      null
    );
  }
  if (norm === "groq") {
    return process.env.GROQ_API_KEY?.trim() || null;
  }
  if (norm === "openai-compatible") {
    return (
      process.env.OPENAI_COMPATIBLE_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      null
    );
  }
  return null;
}

/**
 * Predictable precedence:
 * 1. Explicit CLI Flag / Argument
 * 2. Environment Variable
 * 3. Secure Credential Store
 * 4. None
 */
export async function resolveApiKey(
  provider: string,
  explicitKey?: string,
): Promise<ResolvedKey> {
  if (explicitKey && explicitKey.trim().length > 0) {
    return {
      key: explicitKey.trim(),
      source: "flag",
    };
  }

  const envKey = getEnvApiKey(provider);
  if (envKey) {
    return {
      key: envKey,
      source: "env",
      envVarName: getEnvVarNameForProvider(provider) || undefined,
    };
  }

  const storedKey = await getApiKey(provider);
  if (storedKey) {
    return {
      key: storedKey,
      source: "store",
    };
  }

  return {
    key: null,
    source: "none",
  };
}

/**
 * Resolves active provider and model with precedence:
 * 1. CLI Flags (--provider, --model)
 * 2. Environment Variables (ZYPECODE_PROVIDER, ZYPECODE_MODEL)
 * 3. Config File (~/.zypecode/config.json)
 * 4. Hardcoded defaults
 */
export function resolveProviderAndModel(options: {
  providerOverride?: string;
  modelOverride?: string;
}): {
  provider: string;
  model: string;
  providerSource: "flag" | "env" | "config" | "default";
  modelSource: "flag" | "env" | "config" | "default";
} {
  const config = loadConfig();

  let provider = DEFAULT_CONFIG.provider;
  let providerSource: "flag" | "env" | "config" | "default" = "default";

  if (options.providerOverride) {
    provider = options.providerOverride;
    providerSource = "flag";
  } else if (process.env.ZYPECODE_PROVIDER) {
    provider = process.env.ZYPECODE_PROVIDER;
    providerSource = "env";
  } else if (config.provider) {
    provider = config.provider;
    providerSource = "config";
  }

  let model = DEFAULT_CONFIG.model;
  let modelSource: "flag" | "env" | "config" | "default" = "default";

  if (options.modelOverride) {
    model = options.modelOverride;
    modelSource = "flag";
  } else if (process.env.ZYPECODE_MODEL) {
    model = process.env.ZYPECODE_MODEL;
    modelSource = "env";
  } else if (config.model && (!options.providerOverride || options.providerOverride === config.provider)) {
    model = config.model;
    modelSource = "config";
  }

  return { provider, model, providerSource, modelSource };
}

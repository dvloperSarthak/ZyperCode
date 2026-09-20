import { GeminiProvider } from "./gemini.ts";
import { GroqProvider } from "./groq.ts";
import { MistralProvider } from "./mistral.ts";
import { OpenAICompatibleProvider } from "./openai-compatible.ts";
import { OpenRouterProvider } from "./openrouter.ts";
import type { AIProvider, ProviderConfig } from "./types.ts";
import { ProviderError } from "./types.ts";

export * from "./types.ts";
export * from "./http.ts";
export * from "./openrouter.ts";
export * from "./mistral.ts";
export * from "./gemini.ts";
export * from "./groq.ts";
export * from "./openai-compatible.ts";
export * from "./fallback.ts";

export type ProviderFactory = (config?: ProviderConfig) => AIProvider;

const registry = new Map<string, ProviderFactory>();

// Register default providers
registry.set("openrouter", (config) => new OpenRouterProvider(config));
registry.set("mistral", (config) => new MistralProvider(config));
registry.set("gemini", (config) => new GeminiProvider(config));
registry.set("groq", (config) => new GroqProvider(config));
registry.set(
  "openai-compatible",
  (config) => new OpenAICompatibleProvider(config),
);

/**
 * Register a new AI provider without altering core AI logic.
 */
export function registerProvider(id: string, factory: ProviderFactory): void {
  registry.set(id.toLowerCase(), factory);
}

/**
 * Instantiate an AIProvider by id with the supplied configuration.
 */
export function getProvider(id: string, config?: ProviderConfig): AIProvider {
  const factory = registry.get(id.toLowerCase());
  if (!factory) {
    throw new ProviderError(
      `Unknown AI provider: "${id}". Supported providers: ${Array.from(
        registry.keys(),
      ).join(", ")}`,
      {
        providerId: id,
        errorCode: "INVALID_REQUEST",
      },
    );
  }
  return factory(config);
}

/**
 * Check if a provider ID is registered.
 */
export function isProviderSupported(id: string): boolean {
  return registry.has(id.toLowerCase());
}

/**
 * Returns metadata for all registered providers.
 */
export function listSupportedProviders(): Array<{
  id: string;
  name: string;
  defaultModel: string;
}> {
  const result: Array<{ id: string; name: string; defaultModel: string }> = [];
  for (const [id, factory] of registry.entries()) {
    try {
      const p = factory();
      result.push({
        id: p.id,
        name: p.name,
        defaultModel: p.defaultModel,
      });
    } catch {
      result.push({
        id,
        name: id,
        defaultModel: "default",
      });
    }
  }
  return result;
}

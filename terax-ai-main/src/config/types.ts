export interface OpenAICompatibleConfig {
  baseURL?: string;
  model?: string;
}

export interface ZypeCodeConfig {
  provider: string;
  model: string;
  fallbacks?: string[];
  openaiCompatible?: OpenAICompatibleConfig;
}

export const DEFAULT_CONFIG: ZypeCodeConfig = {
  provider: "openrouter",
  model: "qwen/qwen3-coder:free",
  fallbacks: ["groq", "mistral", "gemini"],
  openaiCompatible: {
    baseURL: "http://localhost:11434/v1",
    model: "default",
  },
};

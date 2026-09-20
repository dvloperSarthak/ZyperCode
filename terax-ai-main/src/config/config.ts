import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_CONFIG, type ZypeCodeConfig } from "./types.ts";

const ZYPECODE_DIR = path.join(os.homedir(), ".zypecode");
const CONFIG_FILE = path.join(ZYPECODE_DIR, "config.json");

export function getConfigPath(): string {
  return CONFIG_FILE;
}

function ensureDirectoryExists(): void {
  if (!fs.existsSync(ZYPECODE_DIR)) {
    fs.mkdirSync(ZYPECODE_DIR, { recursive: true });
  }
}

/**
 * Loads configuration from ~/.zypecode/config.json with fallback to defaults.
 */
export function loadConfig(): ZypeCodeConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<ZypeCodeConfig>;

    return {
      provider: parsed.provider || DEFAULT_CONFIG.provider,
      model: parsed.model || DEFAULT_CONFIG.model,
      fallbacks: parsed.fallbacks || DEFAULT_CONFIG.fallbacks,
      openaiCompatible: {
        baseURL:
          parsed.openaiCompatible?.baseURL ||
          DEFAULT_CONFIG.openaiCompatible?.baseURL,
        model:
          parsed.openaiCompatible?.model ||
          DEFAULT_CONFIG.openaiCompatible?.model,
      },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Updates ~/.zypecode/config.json.
 * Strict Security Guarantee: Strips any API key or secret fields before saving.
 */
export function saveConfig(
  updates: Partial<ZypeCodeConfig> & Record<string, unknown>,
): ZypeCodeConfig {
  ensureDirectoryExists();
  const current = loadConfig();

  // Explicitly prevent any API keys from leaking into the JSON config file
  const sanitizedUpdates = { ...updates };
  delete sanitizedUpdates.apiKey;
  delete sanitizedUpdates.key;
  delete sanitizedUpdates.token;
  delete sanitizedUpdates.secret;

  const next: ZypeCodeConfig = {
    provider: (sanitizedUpdates.provider as string) || current.provider,
    model: (sanitizedUpdates.model as string) || current.model,
    fallbacks:
      (sanitizedUpdates.fallbacks as string[]) || current.fallbacks,
    openaiCompatible: {
      baseURL:
        sanitizedUpdates.openaiCompatible?.baseURL ||
        current.openaiCompatible?.baseURL,
      model:
        sanitizedUpdates.openaiCompatible?.model ||
        current.openaiCompatible?.model,
    },
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

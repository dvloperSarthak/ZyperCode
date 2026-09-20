import {
  getApiKey,
  loadConfig,
  maskApiKey,
  resolveApiKey,
  saveConfig,
  setApiKey,
} from "../../config/index.ts";
import { getProvider, isProviderSupported } from "../../providers/index.ts";
import {
  promptPassword,
  promptSelect,
  promptText,
  type SelectOption,
} from "../interactive.ts";

const PROVIDER_OPTIONS: SelectOption[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    hint: "Aggregator with free & paid models",
  },
  { id: "mistral", label: "Mistral", hint: "Mistral AI official API" },
  { id: "gemini", label: "Gemini", hint: "Google Gemini 2.0 / 1.5" },
  { id: "groq", label: "Groq", hint: "High-speed inference" },
  {
    id: "openai-compatible",
    label: "Custom OpenAI-compatible",
    hint: "Local or hosted OpenAI compatible API",
  },
];

export async function runConfig(args: string[] = []): Promise<void> {
  const sub = args[0]?.toLowerCase();

  if (sub === "provider") {
    await handleConfigProvider(args.slice(1));
    return;
  }
  if (sub === "model") {
    await handleConfigModel(args.slice(1));
    return;
  }
  if (sub === "key") {
    await handleConfigKey(args.slice(1));
    return;
  }

  // Default interactive setup menu
  await runInteractiveSetup();
}

async function runInteractiveSetup(): Promise<void> {
  console.log("\n\x1b[1mZypeCode Configuration\x1b[0m\n");

  const currentConfig = loadConfig();
  const defaultIdx = Math.max(
    0,
    PROVIDER_OPTIONS.findIndex((p) => p.id === currentConfig.provider),
  );

  const selected = await promptSelect(
    "Select AI provider:",
    PROVIDER_OPTIONS,
    defaultIdx,
  );
  const providerId = selected.id;

  let baseURL: string | undefined;
  if (providerId === "openai-compatible") {
    const defaultUrl =
      currentConfig.openaiCompatible?.baseURL || "http://localhost:11434/v1";
    console.log(`\nBase URL:`);
    baseURL = await promptText(`> `, defaultUrl);
  }

  console.log(`\nAPI Key:`);
  const currentKey = await getApiKey(providerId);
  const currentKeyMask = currentKey ? ` [Current: ${maskApiKey(currentKey)}]` : "";
  if (currentKeyMask) {
    console.log(`\x1b[90mPress Enter to keep current key${currentKeyMask}\x1b[0m`);
  }
  const keyInput = await promptPassword(`> `);
  const apiKey = keyInput || currentKey || "";

  // Prompt for model
  const providerInstance = getProvider(providerId, {
    apiKey,
    baseURL,
  });

  console.log(`\nModel:`);
  console.log(
    `\x1b[90mDefault: ${providerInstance.defaultModel}\x1b[0m`,
  );
  const modelInput = await promptText(`> `, providerInstance.defaultModel);
  const model = modelInput || providerInstance.defaultModel;

  // Validate credentials by making a minimal API request
  process.stdout.write("\nValidating credentials...");
  try {
    const result = await providerInstance.validateCredentials?.(model);
    if (result && !result.valid) {
      console.log("\n\x1b[31m✗ Validation failed:\x1b[0m", result.error);
      console.log("\nCheck your API key with:\n  zypecode config key\n");
      return;
    }
    console.log(" \x1b[32mDone.\x1b[0m");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("\n\x1b[31m✗ Validation failed:\x1b[0m", msg);
    console.log("\nCheck your API key with:\n  zypecode config key\n");
    return;
  }

  // Save credentials securely
  if (apiKey) {
    await setApiKey(providerId, apiKey);
  }

  // Save non-secret config
  saveConfig({
    provider: providerId,
    model,
    ...(baseURL ? { openaiCompatible: { baseURL, model } } : {}),
  });

  console.log("\x1b[32m✓ API key validated\x1b[0m");
  console.log("\x1b[32m✓ Provider configured\x1b[0m");
  console.log("\x1b[32m✓ Model configured\x1b[0m\n");
}

async function handleConfigProvider(args: string[]): Promise<void> {
  let target = args[0]?.toLowerCase();
  if (!target) {
    const current = loadConfig().provider;
    const defaultIdx = Math.max(
      0,
      PROVIDER_OPTIONS.findIndex((p) => p.id === current),
    );
    const selected = await promptSelect(
      "Select AI provider:",
      PROVIDER_OPTIONS,
      defaultIdx,
    );
    target = selected.id;
  }

  if (!isProviderSupported(target)) {
    console.error(
      `\x1b[31m✗ Unsupported provider: "${target}".\x1b[0m\nSupported: ${PROVIDER_OPTIONS.map((p) => p.id).join(", ")}`,
    );
    return;
  }

  const p = getProvider(target);
  saveConfig({ provider: target, model: p.defaultModel });
  console.log(`\x1b[32m✓ Provider configured: ${target}\x1b[0m`);
  console.log(`\x1b[32m✓ Model defaulted to: ${p.defaultModel}\x1b[0m`);
}

async function handleConfigModel(args: string[]): Promise<void> {
  const config = loadConfig();
  let target = args[0]?.trim();
  if (!target) {
    console.log(`Current provider: \x1b[36m${config.provider}\x1b[0m`);
    console.log(`Current model: \x1b[36m${config.model}\x1b[0m`);
    target = await promptText(`New model name: `);
  }

  if (!target) {
    console.log("No model specified. Kept current.");
    return;
  }

  saveConfig({ model: target });
  console.log(`\x1b[32m✓ Model configured: ${target}\x1b[0m`);
}

async function handleConfigKey(args: string[]): Promise<void> {
  const config = loadConfig();
  const provider = config.provider;
  let key = args[0]?.trim();

  if (!key) {
    const resolved = await resolveApiKey(provider);
    if (resolved.key) {
      console.log(
        `Current key for ${provider}: \x1b[36m${maskApiKey(resolved.key)}\x1b[0m (${resolved.source})`,
      );
    }
    console.log(`Enter new API key for ${provider}:`);
    key = await promptPassword(`> `);
  }

  if (!key) {
    console.log("No key entered. Configuration unchanged.");
    return;
  }

  process.stdout.write("Validating key...");
  try {
    const p = getProvider(provider, { apiKey: key });
    const result = await p.validateCredentials?.(config.model);
    if (result && !result.valid) {
      console.log("\n\x1b[31m✗ Validation failed:\x1b[0m", result.error);
      return;
    }
    await setApiKey(provider, key);
    console.log(" \x1b[32mDone.\x1b[0m");
    console.log(`\x1b[32m✓ API key validated and securely stored for ${provider}.\x1b[0m`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("\n\x1b[31m✗ Validation failed:\x1b[0m", msg);
  }
}

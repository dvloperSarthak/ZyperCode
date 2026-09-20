import { loadConfig, resolveApiKey } from "../../config/index.ts";
import { getProvider, isProviderSupported } from "../../providers/index.ts";

export async function runModels(args: string[] = []): Promise<void> {
  const config = loadConfig();

  let providerId = config.provider;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--provider" && args[i + 1]) {
      providerId = args[i + 1];
      break;
    }
  }

  if (!isProviderSupported(providerId)) {
    console.error(`\x1b[31m✗ Unsupported provider: "${providerId}"\x1b[0m`);
    return;
  }

  const resolved = await resolveApiKey(providerId);
  const provider = getProvider(providerId, {
    apiKey: resolved.key || undefined,
    baseURL:
      providerId === "openai-compatible"
        ? config.openaiCompatible?.baseURL
        : undefined,
  });

  if (!provider.listModels) {
    console.log(
      `Provider "${provider.name}" does not support dynamic model listing.`,
    );
    console.log(`Current configured model: \x1b[36m${config.model}\x1b[0m`);
    return;
  }

  console.log(
    `Fetching models from \x1b[1m${provider.name}\x1b[0m...\n`,
  );

  const onlyFree = args.includes("--free");

  try {
    const rawModels = await provider.listModels();
    const models = onlyFree ? rawModels.filter((m) => m.isFree) : rawModels;

    if (models.length === 0) {
      console.log(
        `No ${onlyFree ? "free " : ""}models returned by ${provider.name}.`,
      );
      return;
    }

    console.log(
      `${"MODEL ID".padEnd(45)} ${"FREE?".padEnd(8)} ${"CONTEXT".padEnd(10)} NAME`,
    );
    console.log("-".repeat(80));

    for (const m of models) {
      const isSelected = m.id === config.model;
      const freeTag = m.isFree ? "\x1b[32m[FREE]\x1b[0m " : "      ";
      const marker = isSelected ? "\x1b[36m* \x1b[0m" : "  ";
      const ctx = m.contextLength ? `${Math.round(m.contextLength / 1000)}k` : "-";
      const idFormatted = m.id.length > 43 ? `${m.id.slice(0, 40)}...` : m.id;

      console.log(
        `${marker}${idFormatted.padEnd(43)} ${freeTag} ${ctx.padEnd(10)} ${m.name || ""}`,
      );
    }

    console.log(
      `\nTotal ${onlyFree ? "free " : ""}models available: ${models.length}`,
    );
    console.log(`\x1b[90m* indicates currently selected model (${config.model})\x1b[0m`);
    console.log(
      `\nTo switch model:\n  zypecode config model <model-id>\n  or run: zypecode --model <model-id>\n`,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31m✗ Could not list models:\x1b[0m ${msg}`);
    if (!resolved.key) {
      console.log(
        `\n\x1b[33mTip:\x1b[0m Configure your API key to list private/all models:\n  zypecode config key\n`,
      );
    }
  }
}

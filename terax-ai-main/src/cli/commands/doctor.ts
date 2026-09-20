import {
  loadConfig,
  maskApiKey,
  resolveApiKey,
  resolveProviderAndModel,
} from "../../config/index.ts";
import { getProvider, isProviderSupported } from "../../providers/index.ts";

export async function runDoctor(args: string[] = []): Promise<void> {
  console.log("\n\x1b[1mZypeCode Doctor — System & Provider Diagnostics\x1b[0m\n");

  let providerOverride: string | undefined;
  let modelOverride: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--provider" && args[i + 1]) {
      providerOverride = args[i + 1];
    }
    if (args[i] === "--model" && args[i + 1]) {
      modelOverride = args[i + 1];
    }
  }

  const { provider: providerId, model, providerSource, modelSource } =
    resolveProviderAndModel({
      providerOverride,
      modelOverride,
    });

  let hasErrors = false;

  // 1. Provider configuration check
  if (!isProviderSupported(providerId)) {
    console.log(
      `\x1b[31m✗ Provider configuration:\x1b[0m Unknown provider "${providerId}"`,
    );
    console.log(`  Run: zypecode config provider`);
    return;
  }
  console.log(
    `\x1b[32m✓ Provider configured:\x1b[0m ${providerId} (${providerSource})`,
  );

  // 2. Selected model check
  console.log(
    `\x1b[32m✓ Selected model:\x1b[0m ${model} (${modelSource})`,
  );

  // 3. API key availability check
  const resolved = await resolveApiKey(providerId);
  if (!resolved.key) {
    if (providerId === "openai-compatible") {
      console.log(
        `\x1b[33m! API key:\x1b[0m (optional for custom OpenAI-compatible)`,
      );
    } else {
      console.log(
        `\x1b[31m✗ API key availability:\x1b[0m Not configured`,
      );
      console.log(`  Run:\n    zypecode config key`);
      hasErrors = true;
    }
  } else {
    const sourceDesc =
      resolved.source === "env"
        ? `env ${resolved.envVarName}`
        : resolved.source === "store"
          ? "secure store"
          : resolved.source;
    console.log(
      `\x1b[32m✓ API key available:\x1b[0m ${maskApiKey(resolved.key)} (${sourceDesc})`,
    );
  }

  // If no key and not optional, don't continue to network checks
  if (hasErrors) {
    console.log(`\n\x1b[31mDoctor found issues. Please configure your credentials above.\x1b[0m\n`);
    return;
  }

  const config = loadConfig();
  const provider = getProvider(providerId, {
    apiKey: resolved.key || undefined,
    baseURL:
      providerId === "openai-compatible"
        ? config.openaiCompatible?.baseURL
        : undefined,
  });

  // 4. API Connectivity & Authentication check
  process.stdout.write("Checking authentication & connectivity...");
  try {
    const valResult = await provider.validateCredentials?.(model);
    if (valResult && !valResult.valid) {
      console.log("\r\x1b[K\x1b[31m✗ Authentication failed:\x1b[0m", valResult.error);
      console.log(`  Check your API key with:\n    zypecode config key\n`);
      return;
    }
    console.log("\r\x1b[K\x1b[32m✓ API connectivity & authentication verified\x1b[0m");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("\r\x1b[K\x1b[31m✗ Connectivity/Authentication failed:\x1b[0m", msg);
    console.log(`  Check your network and key with:\n    zypecode config\n`);
    return;
  }

  // 5. Basic inference request
  process.stdout.write("Running basic inference test...");
  try {
    const response = await provider.chat(
      [{ role: "user", content: "Respond with the single word: OK" }],
      { model, maxTokens: 10 },
    );
    const replySnippet = response.text.trim().slice(0, 30);
    console.log(
      `\r\x1b[K\x1b[32m✓ Basic inference request successful\x1b[0m (Response: "${replySnippet}")`,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(
      `\r\x1b[K\x1b[31m✗ Inference request failed:\x1b[0m ${msg}`,
    );
    hasErrors = true;
  }

  if (hasErrors) {
    console.log(`\n\x1b[31mDoctor completed with errors.\x1b[0m\n`);
  } else {
    console.log(
      `\n\x1b[32m\x1b[1mAll checks passed! ZypeCode AI system is ready.\x1b[0m\n`,
    );
  }
}

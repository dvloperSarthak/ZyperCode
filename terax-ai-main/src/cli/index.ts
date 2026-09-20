import { runChat } from "./commands/chat.ts";
import { runConfig } from "./commands/config.ts";
import { runDoctor } from "./commands/doctor.ts";
import { runModels } from "./commands/models.ts";

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const args = [...argv];

  // Global flags
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log("ZyperCode v0.9.0 (AI Multi-Provider CLI)");
    return;
  }

  const firstArg = args[0]?.toLowerCase();

  if (firstArg === "config") {
    await runConfig(args.slice(1));
    return;
  }

  if (firstArg === "models") {
    await runModels(args.slice(1));
    return;
  }

  if (firstArg === "doctor") {
    await runDoctor(args.slice(1));
    return;
  }

  // Parse options for chat / inference
  let providerOverride: string | undefined;
  let modelOverride: string | undefined;
  const promptParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const item = args[i];
    if (item === "--provider" && args[i + 1]) {
      providerOverride = args[++i];
    } else if (item === "--model" && args[i + 1]) {
      modelOverride = args[++i];
    } else {
      promptParts.push(item);
    }
  }

  const prompt = promptParts.join(" ").trim();
  await runChat({
    providerOverride,
    modelOverride,
    prompt: prompt || undefined,
  });
}

function printHelp(): void {
  console.log(`
\x1b[1mZyperCode — BYOK AI Multi-Provider System\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  zypecode [command] [options]
  zypecode [prompt]
  zypecode

\x1b[1mCOMMANDS:\x1b[0m
  config                   Interactive AI configuration wizard
  config provider [name]   Set preferred AI provider (openrouter, mistral, gemini, groq, openai-compatible)
  config model [name]      Set preferred model
  config key [key]         Set and validate API key securely
  models                   List available models from provider
  doctor                   Run diagnostics (connectivity, credentials, inference)

\x1b[1mOPTIONS:\x1b[0m
  --provider <name>        Override provider for this command
  --model <model>          Override model for this command
  -h, --help               Display help
  -v, --version            Display version

\x1b[1mEXAMPLES:\x1b[0m
  zypecode config
  zypecode doctor
  zypecode models
  zypecode "write a quicksort in TypeScript"
  zypecode --provider groq --model llama-3.3-70b-versatile
`);
}

import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (
  entryFile === currentFile ||
  entryFile.endsWith("zypecode.js") ||
  entryFile.endsWith("index.ts")
) {
  runCli().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31mFatal error:\x1b[0m`, msg);
    process.exit(1);
  });
}

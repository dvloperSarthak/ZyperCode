import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runDoctor } from "./commands/doctor.ts";
import { runModels } from "./commands/models.ts";
import { runCli } from "./index.ts";

describe("CLI Commands", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("prints help when --help is passed", async () => {
    await runCli(["--help"]);
    const output = logSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
    expect(output).toContain("ZyperCode — BYOK AI Multi-Provider System");
    expect(output).toContain("USAGE:");
    expect(output).toContain("COMMANDS:");
  });

  it("prints version when --version is passed", async () => {
    await runCli(["--version"]);
    const output = logSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
    expect(output).toContain("ZyperCode v");
  });

  it("doctor reports unconfigured API key gracefully", async () => {
    // Ensure no key is set for gemini
    delete process.env.GEMINI_API_KEY;
    await runDoctor(["--provider", "gemini"]);
    const rawOutput = logSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
    // Strip ANSI codes for clean assertion
    const output = rawOutput.replace(/\u001b\[[0-9;]*m/g, "");
    expect(output).toContain("Provider configured: gemini");
    expect(output).toContain("API key availability: Not configured");
    expect(output).toContain("zypecode config key");
  });

  it("models command prints warning if provider is unsupported", async () => {
    await runModels(["--provider", "invalid-provider"]);
    const errOutput = errSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
    expect(errOutput).toContain("Unsupported provider");
  });
});

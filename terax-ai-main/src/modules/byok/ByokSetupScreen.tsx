import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROVIDERS,
  providerSupportsKey,
  type ProviderId,
  type ProviderInfo,
} from "@/modules/ai/config";
import {
  AiSecurityIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  SparklesIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { ProviderIcon } from "@/settings/components/ProviderIcon";

type Props = {
  onSave: (providerId: ProviderId, apiKey: string) => Promise<boolean>;
  onSkip: () => void;
  externalError?: string | null;
};

// Supported cloud providers for BYOK
const SUPPORTED_BYOK_PROVIDERS: ProviderId[] = [
  "openrouter",
  "anthropic",
  "openai",
  "google",
  "groq",
  "cerebras",
  "xai",
  "mistral",
  "deepseek",
  "openai-compatible",
];

export function ByokSetupScreen({ onSave, onSkip, externalError }: Props) {
  const [selectedProviderId, setSelectedProviderId] =
    useState<ProviderId>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [revealKey, setRevealKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableProviders = useMemo(() => {
    return PROVIDERS.filter(
      (p) =>
        SUPPORTED_BYOK_PROVIDERS.includes(p.id) && providerSupportsKey(p.id),
    );
  }, []);

  const activeProvider = useMemo<ProviderInfo | undefined>(() => {
    return availableProviders.find((p) => p.id === selectedProviderId);
  }, [availableProviders, selectedProviderId]);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      setValidationError(null);

      const trimmed = apiKey.trim();
      if (!trimmed) {
        setValidationError("Please enter an API key.");
        return;
      }

      setIsSubmitting(true);
      try {
        const success = await onSave(selectedProviderId, trimmed);
        if (!success) {
          setIsSubmitting(false);
        }
      } catch (err: unknown) {
        setIsSubmitting(false);
        const msg =
          err instanceof Error
            ? err.message
            : "Could not save your API key. Please try again.";
        setValidationError(msg);
      }
    },
    [apiKey, onSave, selectedProviderId],
  );

  const handleOpenConsole = useCallback(() => {
    if (!activeProvider?.consoleUrl) return;
    try {
      openUrl(activeProvider.consoleUrl).catch(() => {
        window.open(activeProvider.consoleUrl, "_blank");
      });
    } catch {
      window.open(activeProvider.consoleUrl, "_blank");
    }
  }, [activeProvider]);

  const activeError = validationError || externalError;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0C] text-foreground p-4 select-none overflow-y-auto">
      {/* Cinematic top ambient glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-64 bg-[#E7B54D]/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-48 bg-primary/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-[460px] rounded-2xl border border-white/[0.08] bg-[#0E0E12]/95 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] p-8 text-foreground transition-all animate-in fade-in zoom-in-95 duration-500">
        {/* Monospace Pill Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7B54D]/10 border border-[#E7B54D]/25 text-[#E7B54D] font-mono text-[11px] tracking-wider uppercase">
            <div className="size-1.5 rounded-full bg-[#E7B54D] shadow-[0_0_8px_rgba(231,181,77,0.8)] animate-pulse" />
            <span>ZyperCode</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Connect your AI</span>
            <HugeiconsIcon
              icon={SparklesIcon}
              size={18}
              className="text-[#E7B54D]"
            />
          </h1>
          <p className="text-[13px] text-[#8E8E9A] leading-relaxed max-w-[340px] mx-auto">
            Bring your own API key to unlock ZyperCode&apos;s AI agent, autocomplete,
            and code intelligence.
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="byok-provider-select"
              className="block text-[12px] font-medium text-[#C0C0CC]"
            >
              Provider
            </label>
            <Select
              value={selectedProviderId}
              onValueChange={(val) => {
                setSelectedProviderId(val as ProviderId);
                setValidationError(null);
              }}
            >
              <SelectTrigger
                id="byok-provider-select"
                className="w-full h-11 bg-[#131318] border-white/[0.1] text-white focus:ring-1 focus:ring-[#E7B54D]/50 focus:border-[#E7B54D]/50 rounded-lg text-[13px]"
              >
                <div className="flex items-center gap-2.5">
                  <ProviderIcon provider={selectedProviderId} size={16} />
                  <SelectValue placeholder="Select provider" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#131318] border-white/[0.1] text-white rounded-lg max-h-64 shadow-2xl">
                {availableProviders.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="flex items-center gap-2.5 text-[13px] hover:bg-white/[0.06] focus:bg-[#E7B54D]/15 focus:text-[#E7B54D] cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2">
                      <ProviderIcon provider={p.id} size={14} />
                      <span>{p.label}</span>
                      {p.id === "openrouter" && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#E7B54D]/20 text-[#E7B54D] ml-1">
                          Recommended
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Provider console direct link */}
            {activeProvider?.consoleUrl && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleOpenConsole}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#E7B54D]/90 hover:text-[#E7B54D] transition-colors hover:underline cursor-pointer"
                >
                  <span>Get an API key from {activeProvider.label}</span>
                  <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} />
                </button>
              </div>
            )}
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="byok-key-input"
              className="block text-[12px] font-medium text-[#C0C0CC]"
            >
              API Key
            </label>
            <div className="relative">
              <Input
                id="byok-key-input"
                type={revealKey ? "text" : "password"}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setValidationError(null);
                }}
                placeholder={
                  activeProvider?.keyPrefix
                    ? `e.g. ${activeProvider.keyPrefix}••••••••`
                    : "Paste your API key here"
                }
                disabled={isSubmitting}
                className="w-full h-11 pr-10 bg-[#131318] border-white/[0.1] text-white font-mono text-[13px] placeholder:text-[#52525E] focus:ring-1 focus:ring-[#E7B54D]/50 focus:border-[#E7B54D]/50 rounded-lg transition-all"
              />
              <button
                type="button"
                onClick={() => setRevealKey(!revealKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#787884] hover:text-white transition-colors cursor-pointer rounded"
                aria-label={revealKey ? "Hide API key" : "Show API key"}
              >
                <HugeiconsIcon
                  icon={revealKey ? ViewOffSlashIcon : ViewIcon}
                  size={16}
                />
              </button>
            </div>
          </div>

          {/* Error Message Box */}
          {activeError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-[12px] font-mono leading-relaxed animate-in fade-in duration-200">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={16}
                className="shrink-0 mt-0.5"
              />
              <span className="flex-1">{activeError}</span>
            </div>
          )}

          {/* Security Guarantee Note */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.025] border border-white/[0.05] text-[11.5px] text-[#7A7A86] leading-relaxed">
            <HugeiconsIcon
              icon={AiSecurityIcon}
              size={15}
              className="text-[#E7B54D] shrink-0"
            />
            <span>
              Your key is encrypted in your local OS keychain and never leaves
              your machine.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              disabled={isSubmitting || !apiKey.trim()}
              className="w-full h-11 text-[13px] font-semibold bg-[#E7B54D] hover:bg-[#d49e35] text-[#0A0A0C] rounded-lg shadow-[0_4px_24px_rgba(231,181,77,0.3)] hover:shadow-[0_4px_30px_rgba(231,181,77,0.5)] border-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin size-4 text-[#0A0A0C]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Saving securely…</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Continue</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2.5} />
                </>
              )}
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onSkip}
                disabled={isSubmitting}
                className="text-[12px] font-mono text-[#787884] hover:text-[#C0C0CC] transition-colors py-1 px-3 cursor-pointer rounded hover:bg-white/[0.04]"
              >
                Skip for now
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Footer hint */}
      <div className="mt-4 text-center font-mono text-[11px] text-[#555562]">
        You can change providers and manage keys anytime in Settings → Models
      </div>
    </div>
  );
}

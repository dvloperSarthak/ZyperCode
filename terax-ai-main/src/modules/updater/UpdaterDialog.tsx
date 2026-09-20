import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download01Icon,
  Refresh01Icon,
  Tick02Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useState } from "react";
import { useUpdater } from "./useUpdater";

type DistroKey = "arch" | "debian" | "fedora";

function distroCommand(key: DistroKey, version: string): string {
  switch (key) {
    case "arch":
      return "yay -S zypercode-bin";
    case "debian":
      return `sudo apt install ./ZyperCode_${version}_amd64.deb`;
    case "fedora":
      return `sudo dnf install ./ZyperCode-${version}-1.x86_64.rpm`;
  }
}

const DISTROS: { key: DistroKey; label: string }[] = [
  { key: "arch", label: "Arch" },
  { key: "debian", label: "Debian / Ubuntu" },
  { key: "fedora", label: "Fedora / RHEL" },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function UpdaterDialog() {
  const { status, dialogOpen, setDialogOpen, check, download, install, dismiss } =
    useUpdater();
  const [copied, setCopied] = useState(false);
  const [distro, setDistro] = useState<DistroKey>("arch");

  const manualVersion =
    status.kind === "manual-available" ? status.info.version : "";
  const activeCommand = distroCommand(distro, manualVersion);

  const isChecking = status.kind === "checking";
  const isUpToDate = status.kind === "uptodate";
  const isAvailable = status.kind === "available";
  const isManual = status.kind === "manual-available";
  const isDownloading = status.kind === "downloading";
  const isDownloaded = status.kind === "downloaded";
  const isInstalling = status.kind === "installing";
  const isError = status.kind === "error";

  const manual = isManual ? status.info : null;
  const updateVersion =
    isAvailable
      ? status.version
      : isDownloading
        ? status.version
        : isDownloaded
          ? status.version
          : isInstalling
            ? status.version
            : "";

  const copyCommand = async () => {
    if (!navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(activeCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const progress = isDownloading ? status.percentage : null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-[480px] bg-[#0A0A0C]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_50px_rgba(0,0,0,0.8)] p-6 text-foreground overflow-hidden relative">
        {/* Subtle top ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#E7B54D]/10 blur-3xl pointer-events-none rounded-full" />

        <DialogHeader className="pb-1 text-left">
          {/* setupscreenlikethis.html style Monospace Pill */}
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#E7B54D]/10 border border-[#E7B54D]/25 text-[#E7B54D] font-mono text-[11px] tracking-wide w-fit mb-2.5">
            <div className="size-1.5 rounded-full bg-[#E7B54D] shadow-[0_0_8px_rgba(231,181,77,0.8)] animate-pulse" />
            <span>zypercode — auto updater</span>
          </div>

          <DialogTitle className="flex items-center gap-3 text-[19px] font-semibold tracking-tight text-white">
            {isDownloaded ? (
              <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                <HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2} />
              </div>
            ) : isDownloading ? (
              <div className="size-8 rounded-lg bg-[#E7B54D]/15 border border-[#E7B54D]/30 flex items-center justify-center text-[#E7B54D] shadow-sm shrink-0">
                <HugeiconsIcon icon={Download01Icon} size={18} strokeWidth={2} className="animate-bounce" />
              </div>
            ) : isError ? (
              <div className="size-8 rounded-lg bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive shadow-sm shrink-0">
                <HugeiconsIcon icon={AlertCircleIcon} size={18} strokeWidth={2} />
              </div>
            ) : isUpToDate ? (
              <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                <HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2} />
              </div>
            ) : (
              <div className="size-8 rounded-lg bg-[#E7B54D]/15 border border-[#E7B54D]/30 flex items-center justify-center text-[#E7B54D] shadow-sm shrink-0">
                <HugeiconsIcon icon={Download01Icon} size={18} strokeWidth={2} />
              </div>
            )}

            <span>
              {isDownloaded
                ? "Update Ready to Install"
                : isDownloading
                  ? "Downloading ZyperCode Update…"
                  : isInstalling
                    ? "Installing Update…"
                    : isError
                      ? "Update Failed"
                      : isUpToDate
                        ? "You're Up to Date"
                        : isChecking
                          ? "Checking for Updates…"
                          : manual
                            ? `ZyperCode v${manual.version} is Available`
                            : `ZyperCode v${updateVersion} is Available`}
            </span>
          </DialogTitle>

          {/* Golden accent bar matching setupscreenlikethis.html */}
          <div className="w-10 h-[2px] bg-[#E7B54D] shadow-[0_0_12px_rgba(231,181,77,0.5)] my-2 rounded-full" />

          <DialogDescription className="text-[13px] text-[#888892] pt-0.5 leading-relaxed">
            {isDownloaded ? (
              <span>
                ZyperCode <strong className="text-[#E7B54D] font-mono">v{updateVersion}</strong> has been downloaded and cryptographically verified. Click <strong className="text-white">Restart &amp; Update</strong> to apply changes immediately.
              </span>
            ) : isDownloading ? (
              <span>
                Streaming ZyperCode <strong className="text-[#E7B54D] font-mono">v{updateVersion}</strong> in the background. You can continue working without interruption.
              </span>
            ) : isInstalling ? (
              <span>
                ZyperCode is closing and applying the update. The app will relaunch automatically in a moment.
              </span>
            ) : isError ? (
              <span className="text-red-400">{status.message}</span>
            ) : isUpToDate ? (
              <span>
                ZyperCode is running the latest available build (<strong className="text-[#E7B54D] font-mono">v{status.version}</strong>). Your editor is fully up to date.
              </span>
            ) : isChecking ? (
              <span>Querying the latest release metadata from GitHub Releases…</span>
            ) : manual ? (
              <span>
                Current: <strong className="text-white font-mono">v{manual.currentVersion}</strong>. Select your package manager or download directly from GitHub Releases.
              </span>
            ) : (
              <span>
                A new version of ZyperCode (<strong className="text-[#E7B54D] font-mono">v{updateVersion}</strong>) is available with features, security updates, and performance improvements.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Release notes preview */}
        {isAvailable && status.body && (
          <div className="my-2 max-h-36 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#0E0E12] p-3 text-[12px] font-mono leading-relaxed text-[#9A9AA6] shadow-inner">
            <div className="text-[10px] uppercase tracking-wider text-[#E7B54D] font-semibold mb-1">Release Highlights</div>
            {status.body}
          </div>
        )}

        {/* setupscreenlikethis.html style Progress Track & Meta */}
        {isDownloading && (
          <div className="my-3 flex flex-col gap-2">
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#d49e35] to-[#E7B54D] rounded-full shadow-[0_0_12px_rgba(231,181,77,0.5)] transition-all duration-700 ease-[cubic-bezier(.22,.68,0,1.01)]"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between items-baseline font-mono text-[11.5px] text-[#888892] mt-1">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#E7B54D] animate-ping" />
                {progress !== null
                  ? progress < 25
                    ? "querying release package"
                    : progress < 85
                      ? "downloading core update package"
                      : progress < 100
                        ? "verifying cryptographic signature"
                        : "ready to install"
                  : "connecting to server…"}
              </span>
              <span className="text-[#E7B54D] font-medium">
                {progress !== null ? `${progress}%` : "0%"}
                {status.contentLength ? ` (${formatBytes(status.downloaded)} / ${formatBytes(status.contentLength)})` : ""}
              </span>
            </div>
          </div>
        )}

        {/* Manual Linux Distro Picker */}
        {manual && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex gap-1 rounded-lg bg-[#0E0E12] border border-white/[0.06] p-1">
              {DISTROS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDistro(d.key)}
                  className={`flex-1 rounded-md px-2 py-1 text-[11px] font-mono transition-all ${
                    distro === d.key
                      ? "bg-[#E7B54D]/15 border border-[#E7B54D]/30 text-[#E7B54D] font-medium"
                      : "text-[#888892] hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0E0E12] px-3 py-2 font-mono text-[12px] text-white">
              <span className="flex-1 select-all text-[#D0D0DA]">$ {activeCommand}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] hover:bg-white/[0.06] text-[#E7B54D]"
                onClick={() => void copyCommand()}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="mt-3 pt-3 border-t border-white/[0.08] gap-2">
          {isAvailable && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismiss}
                className="text-[#888892] hover:text-white hover:bg-white/[0.05]"
              >
                Later
              </Button>
              <Button
                size="sm"
                onClick={() => void download()}
                className="gap-1.5 bg-[#E7B54D] hover:bg-[#d49e35] text-[#0A0A0C] font-semibold shadow-[0_4px_20px_rgba(231,181,77,0.25)] hover:shadow-[0_4px_24px_rgba(231,181,77,0.4)] border-none transition-all"
              >
                <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={2.5} />
                Download Update
              </Button>
            </>
          )}

          {isDownloading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="w-full text-[12px] border-white/[0.1] bg-transparent text-[#9A9AA6] hover:text-white hover:bg-white/[0.05]"
            >
              Download in Background
            </Button>
          )}

          {isDownloaded && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismiss}
                className="text-[#888892] hover:text-white hover:bg-white/[0.05]"
              >
                Later
              </Button>
              <Button
                size="sm"
                onClick={() => void install()}
                className="gap-1.5 bg-[#E7B54D] hover:bg-[#d49e35] text-[#0A0A0C] font-semibold shadow-[0_4px_20px_rgba(231,181,77,0.3)] hover:shadow-[0_4px_24px_rgba(231,181,77,0.5)] border-none transition-all"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.5} />
                Restart &amp; Update
              </Button>
            </>
          )}

          {isInstalling && (
            <div className="flex items-center justify-center gap-2 text-[12px] text-[#888892] w-full py-1">
              <HugeiconsIcon icon={Refresh01Icon} size={14} className="animate-spin text-[#E7B54D]" />
              Restarting ZyperCode…
            </div>
          )}

          {isUpToDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="text-[12px] border-white/[0.1] bg-transparent text-[#D0D0DA] hover:text-white hover:bg-white/[0.05]"
            >
              Close
            </Button>
          )}

          {isError && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="text-[12px] text-[#888892] hover:text-white"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => void check({ manual: true })}
                className="gap-1.5 bg-[#E7B54D] hover:bg-[#d49e35] text-[#0A0A0C] font-semibold"
              >
                <HugeiconsIcon icon={Refresh01Icon} size={13} strokeWidth={2.5} />
                Retry Check
              </Button>
            </>
          )}

          {manual && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismiss}
                className="text-[#888892] hover:text-white"
              >
                Later
              </Button>
              <Button
                size="sm"
                onClick={() => void openUrl(manual.releaseUrl)}
                className="gap-1.5 bg-[#E7B54D] hover:bg-[#d49e35] text-[#0A0A0C] font-semibold"
              >
                Download Package
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

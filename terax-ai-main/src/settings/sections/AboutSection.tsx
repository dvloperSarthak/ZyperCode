import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUpdater } from "@/modules/updater";
import { GithubIcon, Globe02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getName, getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { arch, platform } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";

const REPO_URL = "https://github.com/dvloperSarthak/ZyperCode";

function openExternalUrl(url: string) {
  try {
    openUrl(url).catch(() => {
      window.open(url, "_blank");
    });
  } catch {
    window.open(url, "_blank");
  }
}

const PLATFORM_LABEL: Record<string, string> = {
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
  ios: "iOS",
  android: "Android",
  freebsd: "FreeBSD",
};

export function AboutSection() {
  const [version, setVersion] = useState("");
  const [name, setName] = useState("ZyperCode");
  const [build, setBuild] = useState("");
  const { status, check, download, install } = useUpdater({ autoCheck: false });
  const checking = status.kind === "checking";
  const downloading = status.kind === "downloading";
  const available = status.kind === "available";
  const manualAvailable = status.kind === "manual-available";
  const downloaded = status.kind === "downloaded";
  const installing = status.kind === "installing";

  const checkLabel =
    status.kind === "uptodate"
      ? `You're up to date (v${status.version})`
      : status.kind === "error"
        ? "Check failed — retry"
        : checking
          ? "Checking…"
          : downloading
            ? `Downloading… ${status.percentage}%`
            : downloaded
              ? `Restart & Update to v${status.version}`
              : installing
                ? "Restarting…"
                : available
                  ? `Download v${status.version}`
                  : manualAvailable
                    ? `Update to v${status.info.version}`
                    : "Check for updates";

  const onUpdateClick = () => {
    if (downloaded) void install();
    else if (available) void download();
    else void check({ manual: true });
  };

  useEffect(() => {
    void getVersion().then(setVersion);
    void getName().then(setName);
    try {
      const p = platform();
      const a = arch();
      const platformLabel = PLATFORM_LABEL[p] ?? p;
      setBuild(`${platformLabel} · ${a}`);
    } catch {
      setBuild("");
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="About" description="" />

      <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 p-5">
        <img src="/logo.png" alt="ZyperCode Logo" className="size-14 rounded-lg object-contain" draggable={false} />
        <div className="flex min-w-0 flex-col">
          <span className="text-[16px] font-semibold tracking-tight">
            {name || "ZyperCode"}
          </span>
          <span className="text-[12px] font-medium text-primary">
            Created By Zyper teams
          </span>
          <span className="mt-1 font-mono text-[11px] text-muted-foreground">
            v{version || "0.9.0-beta"}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-[110px_1fr] gap-y-2.5 text-[12px]">
        <dt className="text-muted-foreground">Team</dt>
        <dd className="font-medium text-foreground">Created By Zyper teams</dd>

        <dt className="text-muted-foreground">Build</dt>
        <dd className="font-mono text-[11.5px]">
          {build ? `${build} · v${version || "0.9.0-beta"}` : `v${version || "0.9.0-beta"}`}
        </dd>

        <dt className="text-muted-foreground">License</dt>
        <dd>Apache 2.0</dd>

        <dt className="text-muted-foreground">Git Repository</dt>
        <dd>
          <button
            type="button"
            onClick={() => openExternalUrl(REPO_URL)}
            className="inline-flex items-center gap-1.5 rounded-md text-[12px] underline-offset-2 hover:text-foreground hover:underline"
          >
            <HugeiconsIcon icon={GithubIcon} size={12} strokeWidth={1.75} />
            ZyperCode on GitHub
          </button>
        </dd>

        <dt className="text-muted-foreground">Website</dt>
        <dd className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <HugeiconsIcon icon={Globe02Icon} size={12} strokeWidth={1.75} />
            zypercode.com
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary border border-primary/20">
            Coming Soon
          </span>
        </dd>
      </dl>

      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onUpdateClick}
            disabled={checking || installing}
            className={downloaded ? "bg-emerald-600 hover:bg-emerald-500 text-white font-medium" : undefined}
          >
            {checkLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openExternalUrl(REPO_URL)}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={GithubIcon} size={12} strokeWidth={1.75} />
            View on GitHub
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                localStorage.removeItem("zypercode_intro_completed");
              } catch {}
              window.location.href = "/";
            }}
            className="gap-1.5"
            title="Play the cinematic intro on startup again"
          >
            Replay Intro
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void openUrl(`${REPO_URL}/issues/new`)}
          >
            Report an issue
          </Button>
        </div>
        {status.kind === "error" && (
          <p className="font-mono text-[10.5px] break-all text-destructive/80">
            {status.message}
          </p>
        )}
        {downloading && (
          <div className="flex items-center gap-2 max-w-xs mt-1">
            <Progress value={status.percentage} className="h-2 flex-1" />
            <span className="text-[11px] font-mono text-muted-foreground">{status.percentage}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { create } from "zustand";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { IS_LINUX } from "@/lib/platform";

const LAST_CHECK_KEY = "zypercode:updater:last-check";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour throttle for automatic startup checks
export const DEFAULT_GITHUB_REPO = "dvloperSarthak/ZyperCode";
export const GITHUB_LATEST_RELEASE = `https://api.github.com/repos/${DEFAULT_GITHUB_REPO}/releases/latest`;

export interface ManualUpdateInfo {
  version: string;
  currentVersion: string;
  body: string;
  releaseUrl: string;
}

export type UpdaterStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "uptodate"; version: string }
  | {
      kind: "available";
      update: Update;
      version: string;
      body?: string;
      date?: string;
    }
  | { kind: "manual-available"; info: ManualUpdateInfo }
  | {
      kind: "downloading";
      downloaded: number;
      contentLength: number | null;
      percentage: number;
      update: Update;
      version: string;
    }
  | { kind: "downloaded"; update: Update; version: string }
  | { kind: "installing"; version: string }
  | { kind: "error"; message: string };

function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
}

function parseVersion(v: string): number[] {
  return v
    .replace(/^v/, "")
    .split("-")[0]
    .split(".")
    .map((p) => Number.parseInt(p, 10) || 0);
}

function isNewer(remote: string, current: string): boolean {
  const a = parseVersion(remote);
  const b = parseVersion(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

function normalizeErrorMessage(err: unknown): string {
  if (!err) return "Unknown error during update.";
  const str = err instanceof Error ? err.message : String(err);
  if (
    /failed to fetch|enotfound|econnrefused|network error|offline/i.test(str)
  ) {
    return "Could not connect to update server. Please check your internet connection.";
  }
  if (/403|rate limit/i.test(str)) {
    return "GitHub API rate limit exceeded. Please try again in a few minutes.";
  }
  if (/signature|pubkey|minisign/i.test(str)) {
    return "Update signature verification failed. Downloaded package was rejected for security.";
  }
  if (/Could not fetch a valid release JSON/i.test(str)) {
    return "No release manifest found on GitHub Releases.";
  }
  return str;
}

async function checkGitHubRelease(currentVersion: string): Promise<ManualUpdateInfo | null> {
  const res = await fetch(GITHUB_LATEST_RELEASE, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}`);
  }
  const data = (await res.json()) as {
    tag_name: string;
    body?: string;
    html_url: string;
  };
  const remote = data.tag_name.replace(/^v/, "");
  if (!isNewer(remote, currentVersion)) return null;
  return {
    version: remote,
    currentVersion,
    body: data.body ?? "",
    releaseUrl: data.html_url,
  };
}

interface UpdaterStore {
  status: UpdaterStatus;
  dialogOpen: boolean;
  currentVersion: string;
  setDialogOpen: (open: boolean) => void;
  checkForUpdates: (options?: { manual?: boolean }) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installAndRestart: () => Promise<void>;
  dismiss: () => void;
}

export const useUpdaterStore = create<UpdaterStore>((set, get) => ({
  status: { kind: "idle" },
  dialogOpen: false,
  currentVersion: "",

  setDialogOpen: (open: boolean) => set({ dialogOpen: open }),

  checkForUpdates: async ({ manual = false } = {}) => {
    // If not running in desktop Tauri app (e.g. browser dev preview)
    if (!isTauri()) {
      if (manual) {
        set({
          status: { kind: "uptodate", version: "0.0.3-web" },
          dialogOpen: true,
        });
      }
      return;
    }

    // Throttle automatic checks on startup
    if (!manual) {
      if (import.meta.env.DEV) return;
      const last = Number(localStorage.getItem(LAST_CHECK_KEY) ?? 0);
      if (Date.now() - last < CHECK_INTERVAL_MS) return;
    }

    set({ status: { kind: "checking" } });

    let currentVer = get().currentVersion;
    if (!currentVer) {
      try {
        currentVer = await getVersion();
        set({ currentVersion: currentVer });
      } catch {
        currentVer = "0.0.3";
      }
    }

    try {
      if (IS_LINUX) {
        const info = await checkGitHubRelease(currentVer);
        if (info) {
          set({
            status: { kind: "manual-available", info },
            dialogOpen: true,
          });
        } else {
          localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
          set({ status: { kind: "uptodate", version: currentVer } });
        }
        return;
      }

      let nativeChecked = false;
      try {
        const update = await check();
        nativeChecked = true;
        if (update && isNewer(update.version, currentVer)) {
          set({
            status: {
              kind: "available",
              update,
              version: update.version,
              body: update.body,
              date: update.date,
            },
            dialogOpen: true,
          });
          return;
        }
      } catch (nativeErr) {
        console.warn("[zypercode-updater] Native check failed, falling back to GitHub Releases API:", nativeErr);
      }

      // Secondary fallback directly to GitHub Releases API (e.g. unsigned releases or portable exe)
      try {
        const ghInfo = await checkGitHubRelease(currentVer);
        if (ghInfo) {
          set({
            status: { kind: "manual-available", info: ghInfo },
            dialogOpen: true,
          });
          return;
        }
      } catch (ghErr) {
        if (!nativeChecked) throw ghErr;
      }

      localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
      set({ status: { kind: "uptodate", version: currentVer } });
    } catch (err) {
      const errMsg = normalizeErrorMessage(err);
      if (!manual) {
        // Silently preserve idle state if automatic background check encounters offline
        set({ status: { kind: "idle" } });
      } else {
        set({
          status: { kind: "error", message: errMsg },
          dialogOpen: true,
        });
      }
    }
  },

  downloadUpdate: async () => {
    const { status } = get();
    if (status.kind !== "available") return;
    const { update, version } = status;

    let totalLength: number | null = null;
    let downloadedBytes = 0;

    set({
      status: {
        kind: "downloading",
        downloaded: 0,
        contentLength: null,
        percentage: 0,
        update,
        version,
      },
    });

    try {
      await update.download((event) => {
        if (event.event === "Started") {
          totalLength = event.data.contentLength ?? null;
          set({
            status: {
              kind: "downloading",
              downloaded: 0,
              contentLength: totalLength,
              percentage: 0,
              update,
              version,
            },
          });
        } else if (event.event === "Progress") {
          downloadedBytes += event.data.chunkLength;
          const pct = totalLength
            ? Math.min(100, Math.round((downloadedBytes / totalLength) * 100))
            : 0;
          set({
            status: {
              kind: "downloading",
              downloaded: downloadedBytes,
              contentLength: totalLength,
              percentage: pct,
              update,
              version,
            },
          });
        } else if (event.event === "Finished") {
          set({
            status: {
              kind: "downloaded",
              update,
              version,
            },
            dialogOpen: true,
          });
        }
      });

      set({
        status: {
          kind: "downloaded",
          update,
          version,
        },
        dialogOpen: true,
      });
    } catch (err) {
      set({
        status: {
          kind: "error",
          message: `Download failed: ${normalizeErrorMessage(err)}`,
        },
        dialogOpen: true,
      });
    }
  },

  installAndRestart: async () => {
    const { status } = get();
    if (status.kind !== "downloaded") return;
    const { update, version } = status;

    set({ status: { kind: "installing", version } });

    try {
      await update.install();
      await relaunch();
    } catch (err) {
      set({
        status: {
          kind: "error",
          message: `Installation failed: ${normalizeErrorMessage(err)}`,
        },
        dialogOpen: true,
      });
    }
  },

  dismiss: () => {
    const { status } = get();
    // If an update was downloaded, don't discard the downloaded state, just close modal
    if (status.kind !== "downloaded") {
      set({ status: { kind: "idle" }, dialogOpen: false });
    } else {
      set({ dialogOpen: false });
    }
  },
}));

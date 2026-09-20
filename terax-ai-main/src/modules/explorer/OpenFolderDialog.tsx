import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Folder01Icon,
  FolderOpenIcon,
  Home01Icon,
  Download01Icon,
  DocumentCodeIcon,
  Clock01Icon,
  ArrowUp01Icon,
  ArrowRight01Icon,
  Search01Icon,
  Refresh01Icon,
  Tick02Icon,
  AlertCircleIcon,
  ComputerIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { native } from "@/modules/ai/lib/native";
import { useWorkspaceRootStore } from "@/modules/workspace/workspaceRootStore";
import { homeDir } from "@tauri-apps/api/path";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoot: string | null;
};

export function OpenFolderDialog({ open, onOpenChange, currentRoot }: Props) {
  const [folderPath, setFolderPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [systemHome, setSystemHome] = useState<string | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [subdirs, setSubdirs] = useState<string[]>([]);
  const [filterText, setFilterText] = useState("");
  const [isLoadingSubdirs, setIsLoadingSubdirs] = useState(false);
  const [isValidDir, setIsValidDir] = useState<boolean | null>(null);
  const [availableDrives, setAvailableDrives] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const customRoot = useWorkspaceRootStore((s) => s.customRoot);
  const recentRoots = useWorkspaceRootStore((s) => s.recentRoots);
  const setCustomRoot = useWorkspaceRootStore((s) => s.setCustomRoot);

  // Initialize home dir and common drive roots
  useEffect(() => {
    homeDir()
      .then((h) => {
        const norm = h.replace(/\\/g, "/").replace(/\/+$/, "");
        setSystemHome(norm);
      })
      .catch(() => setSystemHome(null));

    // Detect available Windows drives
    const drives = ["C:", "D:", "E:", "F:"];
    const validDrives: string[] = [];
    Promise.all(
      drives.map(async (drive) => {
        try {
          await native.readDir(`${drive}/`);
          validDrives.push(drive);
        } catch {
          // Drive not mounted or inaccessible
        }
      }),
    ).then(() => {
      if (validDrives.length > 0) {
        setAvailableDrives(validDrives);
      }
    });
  }, []);

  // When dialog opens, initialize folder path
  useEffect(() => {
    if (open) {
      const initial = currentRoot || customRoot || systemHome || "";
      const cleaned = initial.replace(/^["']|["']$/g, "").replace(/\\/g, "/").replace(/\/+$/, "");
      setFolderPath(cleaned);
      setError(null);
      setFilterText("");
    }
  }, [open, currentRoot, customRoot, systemHome]);

  // Load subdirectories for interactive in-dialog folder exploration
  useEffect(() => {
    if (!open) return;
    const trimmed = folderPath.trim().replace(/^["']|["']$/g, "").replace(/\\/g, "/").replace(/\/+$/, "");
    if (!trimmed) {
      setSubdirs([]);
      setIsValidDir(null);
      return;
    }

    let cancelled = false;
    setIsLoadingSubdirs(true);

    const checkPath = trimmed.endsWith(":") ? `${trimmed}/` : trimmed;

    native
      .readDir(checkPath)
      .then((entries) => {
        if (cancelled) return;
        const dirNames = entries
          .filter((e) => e.kind === "dir" && !e.name.startsWith("."))
          .map((e) => e.name)
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
        setSubdirs(dirNames);
        setIsValidDir(true);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setSubdirs([]);
        setIsValidDir(false);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSubdirs(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, folderPath]);

  const handleApplyFolder = useCallback(
    async (targetPath: string) => {
      const trimmed = targetPath.trim().replace(/^["']|["']$/g, "");
      if (!trimmed) {
        setError("Please enter a valid folder path");
        return;
      }
      const normalized = trimmed.replace(/\\/g, "/").replace(/\/+$/, "");
      try {
        await native.workspaceAuthorize(normalized);
        setCustomRoot(normalized);
        onOpenChange(false);
      } catch (err) {
        setError(String(err));
      }
    },
    [setCustomRoot, onOpenChange],
  );

  // Native folder selection via Windows Forms / native shell
  const handleBrowseNative = async () => {
    setIsBrowsing(true);
    setError(null);
    try {
      const isWindows =
        typeof navigator !== "undefined" &&
        (navigator.platform?.toLowerCase().includes("win") ||
          navigator.userAgent?.toLowerCase().includes("windows"));

      if (isWindows) {
        // PowerShell STA FolderBrowserDialog opens the standard native Windows folder dialog
        const psCommand = `powershell -NoProfile -Sta -Command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select Project Folder for ZyperCode'; $d.ShowNewFolderButton = $true; if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($d.SelectedPath) }"`;
        const res = await native.runCommand(psCommand, null, 300);
        const picked = res?.stdout?.trim();
        if (picked) {
          const normalized = picked
            .replace(/^["']|["']$/g, "")
            .replace(/\\/g, "/")
            .replace(/\/+$/, "");
          setFolderPath(normalized);
          await handleApplyFolder(normalized);
          return;
        }
      } else {
        const isMac =
          typeof navigator !== "undefined" &&
          (navigator.platform?.toLowerCase().includes("mac") ||
            navigator.userAgent?.toLowerCase().includes("mac"));

        const cmd = isMac
          ? `osascript -e 'POSIX path of (choose folder with prompt "Select Project Folder for ZyperCode")'`
          : `zenity --file-selection --directory --title="Select Project Folder for ZyperCode" 2>/dev/null || kdialog --getexistingdirectory 2>/dev/null`;

        const res = await native.runCommand(cmd, null, 300);
        const picked = res?.stdout?.trim();
        if (picked) {
          const normalized = picked
            .replace(/^["']|["']$/g, "")
            .replace(/\\/g, "/")
            .replace(/\/+$/, "");
          setFolderPath(normalized);
          await handleApplyFolder(normalized);
          return;
        }
      }
    } catch (err) {
      console.warn("Native folder picker unavailable, falling back to input:", err);
      fileInputRef.current?.click();
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const fullPath = (file as unknown as { path?: string }).path;
    if (fullPath) {
      const dir = fullPath.replace(/\\/g, "/");
      const relative = file.webkitRelativePath.replace(/\\/g, "/");
      const baseDir = dir.endsWith(relative)
        ? dir.slice(0, dir.length - relative.length).replace(/\/+$/, "")
        : dir.substring(0, dir.lastIndexOf("/"));
      if (baseDir) {
        setFolderPath(baseDir);
        void handleApplyFolder(baseDir);
      }
    }
  };

  const handleNavigateUp = () => {
    if (!folderPath) return;
    const normalized = folderPath.replace(/\\/g, "/").replace(/\/+$/, "");
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash > 0) {
      const parent = normalized.substring(0, lastSlash);
      const nextPath = parent.endsWith(":") ? `${parent}/` : parent;
      setFolderPath(nextPath);
    } else if (lastSlash === 0) {
      setFolderPath("/");
    }
  };

  const handleSelectSubdir = (name: string) => {
    const normalized = folderPath.replace(/\\/g, "/").replace(/\/+$/, "");
    const next = `${normalized}/${name}`;
    setFolderPath(next);
  };

  const handleResetToHome = () => {
    setCustomRoot(null);
    onOpenChange(false);
  };

  // Compute breadcrumbs from current path
  const breadcrumbs = useMemo(() => {
    const trimmed = folderPath.trim().replace(/^["']|["']$/g, "").replace(/\\/g, "/").replace(/\/+$/, "");
    if (!trimmed) return [];
    const parts = trimmed.split("/").filter(Boolean);
    const crumbs: { label: string; path: string }[] = [];
    let accum = "";

    parts.forEach((part, idx) => {
      if (idx === 0 && part.includes(":")) {
        accum = `${part}/`;
      } else {
        accum = accum.endsWith("/") ? `${accum}${part}` : `${accum}/${part}`;
      }
      crumbs.push({ label: part, path: accum.replace(/\/+$/, "") });
    });
    return crumbs;
  }, [folderPath]);

  // Filtered subdirectories based on search input
  const filteredSubdirs = useMemo(() => {
    if (!filterText.trim()) return subdirs;
    const lower = filterText.toLowerCase();
    return subdirs.filter((name) => name.toLowerCase().includes(lower));
  }, [subdirs, filterText]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] bg-background/95 backdrop-blur-2xl border border-border/80 shadow-2xl p-6">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <HugeiconsIcon icon={FolderOpenIcon} size={18} strokeWidth={2} />
            </div>
            Open Project Workspace
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-muted-foreground">
            Select a project directory to load into ZyperCode's file tree, editor, and terminal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Main Path Input with Native Browse Button */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-foreground flex items-center gap-1.5">
                Folder Path
                {isValidDir === true && (
                  <span className="text-[11px] text-emerald-500 font-normal flex items-center gap-1">
                    <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2.5} />
                    Valid folder
                  </span>
                )}
                {isValidDir === false && (
                  <span className="text-[11px] text-amber-500 font-normal flex items-center gap-1">
                    <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                    Folder not found
                  </span>
                )}
              </label>
              {folderPath && (
                <button
                  type="button"
                  onClick={() => setFolderPath("")}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={11} />
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={folderPath}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^["']|["']$/g, "").replace(/\\/g, "/");
                    setFolderPath(val);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleApplyFolder(folderPath);
                    }
                  }}
                  placeholder="C:/Projects/my-app or /home/user/code"
                  className="font-mono text-[12px] h-9 pr-8 bg-muted/30 border-border/70 focus-visible:ring-primary/40"
                  autoFocus
                />
              </div>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleBrowseNative}
                disabled={isBrowsing}
                className="shrink-0 gap-1.5 h-9 px-3.5 bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-90 transition-all"
                title="Open native Windows folder picker"
              >
                {isBrowsing ? (
                  <HugeiconsIcon icon={Refresh01Icon} size={14} className="animate-spin" />
                ) : (
                  <HugeiconsIcon icon={Folder01Icon} size={14} strokeWidth={2} />
                )}
                {isBrowsing ? "Browsing..." : "Browse..."}
              </Button>

              {/* Fallback hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is non-standard but supported in Webview2
                webkitdirectory=""
                directory=""
                style={{ display: "none" }}
                onChange={handleFileInputChange}
              />
            </div>

            {error && (
              <span className="text-[11.5px] text-destructive flex items-center gap-1 mt-0.5">
                <HugeiconsIcon icon={AlertCircleIcon} size={13} />
                {error}
              </span>
            )}
          </div>

          {/* Quick Jump Locations & Drives */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Locations
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {availableDrives.map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 text-[11px] gap-1 px-2.5 bg-muted/60 hover:bg-muted font-mono"
                  onClick={() => setFolderPath(`${d}/`)}
                >
                  <HugeiconsIcon icon={ComputerIcon} size={12} className="text-primary" />
                  {d}
                </Button>
              ))}

              {systemHome && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] gap-1.5 px-2.5 bg-muted/60 hover:bg-muted"
                    onClick={() => setFolderPath(systemHome)}
                  >
                    <HugeiconsIcon icon={Home01Icon} size={12} className="text-primary" />
                    Home
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] gap-1.5 px-2.5 bg-muted/60 hover:bg-muted"
                    onClick={() => setFolderPath(`${systemHome}/Desktop`)}
                  >
                    <HugeiconsIcon icon={Folder01Icon} size={12} className="text-primary" />
                    Desktop
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] gap-1.5 px-2.5 bg-muted/60 hover:bg-muted"
                    onClick={() => setFolderPath(`${systemHome}/Documents`)}
                  >
                    <HugeiconsIcon icon={DocumentCodeIcon} size={12} className="text-primary" />
                    Documents
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] gap-1.5 px-2.5 bg-muted/60 hover:bg-muted"
                    onClick={() => setFolderPath(`${systemHome}/Downloads`)}
                  >
                    <HugeiconsIcon icon={Download01Icon} size={12} className="text-primary" />
                    Downloads
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Interactive In-Dialog Folder Browser */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-[11.5px] font-mono scrollbar-none">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleNavigateUp}
                  disabled={!folderPath || folderPath === "/" || folderPath.endsWith(":/")}
                  className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                  title="Go up to parent directory"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} size={13} strokeWidth={2} />
                </Button>

                {breadcrumbs.length === 0 ? (
                  <span className="text-muted-foreground text-[11px]">No path selected</span>
                ) : (
                  breadcrumbs.map((crumb, idx) => (
                    <div key={crumb.path} className="flex items-center gap-1 shrink-0">
                      {idx > 0 && (
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={11}
                          className="text-muted-foreground/60"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setFolderPath(crumb.path)}
                        className={`hover:text-primary transition-colors truncate max-w-[120px] ${
                          idx === breadcrumbs.length - 1
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                        title={crumb.path}
                      >
                        {crumb.label}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Subfolders filter */}
              {subdirs.length > 5 && (
                <div className="relative w-36 shrink-0">
                  <Input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter subfolders..."
                    className="h-6 text-[11px] pl-6 pr-2 bg-background/80"
                  />
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={11}
                    className="absolute left-2 top-1.5 text-muted-foreground"
                  />
                </div>
              )}
            </div>

            {/* Subfolders Grid List */}
            <div className="min-h-[140px] max-h-[180px] overflow-y-auto pr-1">
              {isLoadingSubdirs ? (
                <div className="flex items-center justify-center h-28 text-muted-foreground gap-2 text-[12px]">
                  <HugeiconsIcon icon={Refresh01Icon} size={14} className="animate-spin text-primary" />
                  Loading directory contents...
                </div>
              ) : filteredSubdirs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-28 text-center text-muted-foreground gap-1 text-[12px]">
                  <HugeiconsIcon icon={FolderOpenIcon} size={22} className="opacity-40" />
                  <span>
                    {subdirs.length === 0
                      ? "No subfolders found inside this directory."
                      : "No subfolders match the filter."}
                  </span>
                  <span className="text-[11px] text-muted-foreground/80">
                    Click "Open Folder" below to use this folder as your project workspace.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {filteredSubdirs.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelectSubdir(name)}
                      onDoubleClick={() => {
                        const target = `${folderPath.replace(/\/+$/, "")}/${name}`;
                        void handleApplyFolder(target);
                      }}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border border-border/40 bg-background/50 hover:bg-primary/10 hover:border-primary/40 transition-all text-left group"
                      title={`${name} (Click to enter, Double-click to open)`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <HugeiconsIcon
                          icon={Folder01Icon}
                          size={14}
                          className="text-primary shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <span className="text-[11.5px] font-mono truncate text-foreground group-hover:text-primary transition-colors">
                          {name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 group-hover:text-primary shrink-0">
                        ↵
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subfolders Count Bar */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground/80 border-t border-border/30">
              <span>
                {filteredSubdirs.length} {filteredSubdirs.length === 1 ? "folder" : "folders"}
                {filterText && ` (filtered from ${subdirs.length})`}
              </span>
              <span className="text-[10.5px]">Double-click a folder to open directly</span>
            </div>
          </div>

          {/* Recent Workspaces */}
          {recentRoots.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <HugeiconsIcon icon={Clock01Icon} size={12} />
                Recent Projects
              </span>
              <div className="max-h-[100px] overflow-y-auto rounded-md border border-border/50 divide-y divide-border/40 bg-muted/10">
                {recentRoots.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => void handleApplyFolder(r)}
                    className="w-full text-left px-3 py-1.5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <HugeiconsIcon
                        icon={Folder01Icon}
                        size={13}
                        className="text-muted-foreground shrink-0 group-hover:text-primary"
                      />
                      <span className="text-[11.5px] font-mono truncate text-foreground group-hover:text-primary">
                        {r}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-muted-foreground group-hover:text-primary font-medium shrink-0">
                      Open →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToHome}
            className="text-[11.5px] text-muted-foreground hover:text-foreground h-8"
          >
            Reset to Default
          </Button>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-3 text-[12px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleApplyFolder(folderPath)}
              disabled={!folderPath.trim() || isValidDir === false}
              className="gap-1.5 h-8 px-4 bg-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90 transition-all text-[12px]"
            >
              <HugeiconsIcon icon={FolderOpenIcon} size={14} strokeWidth={2} />
              Open Folder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

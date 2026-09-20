import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Tab } from "./useTabs";
import { useWorkspaceRootStore } from "@/modules/workspace/workspaceRootStore";

type Result = {
  explorerRoot: string | null;
  inheritedCwdForNewTab: () => string | undefined;
};

export function useWorkspaceCwd(
  activeTab: Tab | undefined,
  tabs: Tab[],
  home: string | null,
): Result {
  const customRoot = useWorkspaceRootStore((s) => s.customRoot);
  const lastTerminalCwd = useRef<string | null>(null);

  useEffect(() => {
    if (activeTab?.kind === "terminal" && activeTab.cwd) {
      lastTerminalCwd.current = activeTab.cwd;
    }
  }, [activeTab]);

  const explorerRoot = useMemo<string | null>(() => {
    if (customRoot) return customRoot;
    if (activeTab?.kind === "terminal" && activeTab.cwd) return activeTab.cwd;
    if (lastTerminalCwd.current) return lastTerminalCwd.current;
    const anyTerm = tabs.find((t) => t.kind === "terminal" && t.cwd);
    if (anyTerm?.kind === "terminal" && anyTerm.cwd) return anyTerm.cwd;
    return home;
  }, [customRoot, activeTab, tabs, home]);

  const inheritedCwdForNewTab = useCallback((): string | undefined => {
    if (customRoot) return customRoot;
    if (activeTab?.kind === "terminal" && activeTab.cwd) return activeTab.cwd;
    return lastTerminalCwd.current ?? home ?? undefined;
  }, [customRoot, activeTab, home]);

  return { explorerRoot, inheritedCwdForNewTab };
}

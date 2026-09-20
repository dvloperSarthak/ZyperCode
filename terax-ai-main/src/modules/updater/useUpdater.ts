import { useEffect } from "react";
import {
  useUpdaterStore,
  type UpdaterStatus,
  type ManualUpdateInfo,
} from "./updaterStore";

export type { UpdaterStatus, ManualUpdateInfo };

interface HookOptions {
  /** When false, the hook does not run an automatic check on mount. */
  autoCheck?: boolean;
}

export function useUpdater({ autoCheck = true }: HookOptions = {}) {
  const status = useUpdaterStore((s) => s.status);
  const dialogOpen = useUpdaterStore((s) => s.dialogOpen);
  const setDialogOpen = useUpdaterStore((s) => s.setDialogOpen);
  const check = useUpdaterStore((s) => s.checkForUpdates);
  const download = useUpdaterStore((s) => s.downloadUpdate);
  const install = useUpdaterStore((s) => s.installAndRestart);
  const dismiss = useUpdaterStore((s) => s.dismiss);

  useEffect(() => {
    if (!autoCheck) return;
    // Delay check slightly after startup so it doesn't compete with initial file load
    const timer = setTimeout(() => {
      void check({ manual: false });
    }, 4000);
    return () => clearTimeout(timer);
  }, [autoCheck, check]);

  return {
    status,
    dialogOpen,
    setDialogOpen,
    check,
    download,
    install,
    dismiss,
  };
}

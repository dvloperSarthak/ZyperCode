import { create } from "zustand";

interface WorkspaceRootState {
  customRoot: string | null;
  recentRoots: string[];
  setCustomRoot: (path: string | null) => void;
  addRecentRoot: (path: string) => void;
}

const STORAGE_KEY = "zypercode_active_folder";
const RECENTS_KEY = "zypercode_recent_folders";

function loadInitial(): { root: string | null; recents: string[] } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const recentsStr = localStorage.getItem(RECENTS_KEY);
    const recents = recentsStr ? JSON.parse(recentsStr) : [];
    return {
      root: saved || null,
      recents: Array.isArray(recents) ? recents : [],
    };
  } catch {
    return { root: null, recents: [] };
  }
}

const initial = loadInitial();

export const useWorkspaceRootStore = create<WorkspaceRootState>((set) => ({
  customRoot: initial.root,
  recentRoots: initial.recents,
  setCustomRoot: (path) => {
    try {
      if (path) {
        const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
        localStorage.setItem(STORAGE_KEY, normalized);
        set((s) => {
          const filtered = s.recentRoots.filter((r) => r !== normalized);
          const next = [normalized, ...filtered].slice(0, 10);
          try {
            localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
          } catch {}
          return { customRoot: normalized, recentRoots: next };
        });
      } else {
        localStorage.removeItem(STORAGE_KEY);
        set({ customRoot: null });
      }
    } catch {
      set({ customRoot: path });
    }
  },
  addRecentRoot: (path) => {
    const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
    set((s) => {
      const filtered = s.recentRoots.filter((r) => r !== normalized);
      const next = [normalized, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {}
      return { recentRoots: next };
    });
  },
}));

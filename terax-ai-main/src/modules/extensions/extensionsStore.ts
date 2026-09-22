import { create } from "zustand";
import type { ExtensionCategory, ZyperExtension } from "./types";

const REGISTRY: ZyperExtension[] = [
  {
    id: "ms-python.python",
    name: "Python Intelligence",
    publisher: "Zyper Community",
    version: "2024.12.1",
    description: "IntelliSense, syntax highlighting, code navigation, and formatting for Python.",
    category: "languages",
    installed: true,
    enabled: true,
    icon: "🐍",
    downloads: "2.4M",
    rating: 4.9,
    tags: ["python", "lsp", "intellisense", "debugging"],
    features: [
      "Rich IntelliSense via Pyright",
      "Inline syntax error reporting",
      "Virtualenv & Conda environment detection",
      "Automatic docstring generation",
    ],
  },
  {
    id: "bradlc.vscode-tailwindcss",
    name: "Tailwind CSS IntelliSense",
    publisher: "Tailwind Labs",
    version: "0.14.3",
    description: "Intelligent Tailwind CSS tooling including autocomplete, syntax highlighting, and linting.",
    category: "tools",
    installed: true,
    enabled: true,
    icon: "🌊",
    downloads: "1.8M",
    rating: 4.8,
    tags: ["tailwind", "css", "styling", "autocomplete"],
    features: [
      "Autocomplete for utility classes",
      "Hover class preview & CSS translation",
      "Conflict & syntax error detection",
    ],
  },
  {
    id: "esbenp.prettier-vscode",
    name: "Prettier - Code Formatter",
    publisher: "Prettier",
    version: "10.4.0",
    description: "Opinionated multi-language code formatter supporting JS, TS, HTML, CSS, JSON, and Markdown.",
    category: "formatters",
    installed: true,
    enabled: true,
    icon: "✨",
    downloads: "3.2M",
    rating: 4.9,
    tags: ["formatter", "prettier", "javascript", "typescript"],
    features: [
      "Format on Save support",
      "Project .prettierrc detection",
      "Support for plugins and presets",
    ],
  },
  {
    id: "dbaeumer.vscode-eslint",
    name: "ESLint",
    publisher: "Microsoft",
    version: "3.0.10",
    description: "Integrates ESLint into ZyperCode to analyze code and quickly find/fix problems.",
    category: "linters",
    installed: false,
    enabled: false,
    icon: "🔍",
    downloads: "2.9M",
    rating: 4.7,
    tags: ["eslint", "linter", "javascript", "typescript"],
    features: [
      "Real-time diagnostic warnings",
      "Quick fix actions (Alt+Enter)",
      "Flat config (eslint.config.js) support",
    ],
  },
  {
    id: "rust-lang.rust-analyzer",
    name: "rust-analyzer",
    publisher: "Rust Community",
    version: "0.4.2189",
    description: "Modular compiler-based frontend for the Rust language with blazing fast completions.",
    category: "languages",
    installed: false,
    enabled: false,
    icon: "🦀",
    downloads: "950K",
    rating: 4.9,
    tags: ["rust", "cargo", "lsp", "compiler"],
    features: [
      "Type inference and hover documentation",
      "Inlay hints for parameters and types",
      "Macro expansion view",
      "Run and debug cargo test lenses",
    ],
  },
  {
    id: "catppuccin.catppuccin-vsc",
    name: "Catppuccin Theme Collection",
    publisher: "Catppuccin",
    version: "3.16.0",
    description: "Soothing pastel themes for high-spirited developers (Mocha, Macchiato, Frappé, Latte).",
    category: "themes",
    installed: true,
    enabled: true,
    icon: "🎨",
    downloads: "1.1M",
    rating: 4.9,
    tags: ["theme", "catppuccin", "dark", "pastel"],
    features: [
      "4 curated pastel palette variants",
      "Harmonized syntax token styling",
      "Seamless status bar & terminal integration",
    ],
  },
  {
    id: "eamodio.gitlens",
    name: "GitLens — Git Supercharged",
    publisher: "GitKraken",
    version: "16.1.0",
    description: "Supercharge Git within ZyperCode. Visualise code authorship with Git blame and history navigation.",
    category: "tools",
    installed: false,
    enabled: false,
    icon: "🐙",
    downloads: "1.5M",
    rating: 4.8,
    tags: ["git", "gitlens", "blame", "history", "diff"],
    features: [
      "Inline blame annotations",
      "File and revision commit graphs",
      "Interactive visual rebase",
    ],
  },
  {
    id: "ms-azuretools.vscode-docker",
    name: "Docker & Container Tools",
    publisher: "Microsoft",
    version: "1.29.0",
    description: "Easily build, manage, and deploy containerized applications from ZyperCode.",
    category: "tools",
    installed: false,
    enabled: false,
    icon: "🐳",
    downloads: "880K",
    rating: 4.6,
    tags: ["docker", "containers", "docker-compose"],
    features: [
      "Manage containers, images, and volumes",
      "One-click container log streaming",
      "Dockerfile linting and hover help",
    ],
  },
  {
    id: "shd101wyy.markdown-preview-enhanced",
    name: "Markdown Preview Enhanced",
    publisher: "Yiyi Wang",
    version: "0.8.14",
    description: "Interactive Markdown preview with KaTeX, Mermaid diagrams, PlantUML, and code chunk execution.",
    category: "tools",
    installed: false,
    enabled: false,
    icon: "📝",
    downloads: "720K",
    rating: 4.7,
    tags: ["markdown", "preview", "mermaid", "latex"],
    features: [
      "Live synchronized preview scrolling",
      "Mermaid & KaTeX diagram rendering",
      "Export to HTML and PDF",
    ],
  },
  {
    id: "golang.go",
    name: "Go Language Tools",
    publisher: "Go Team at Google",
    version: "0.43.0",
    description: "Rich Go language support via gopls with testing, debugging, and code navigation.",
    category: "languages",
    installed: false,
    enabled: false,
    icon: "🐹",
    downloads: "640K",
    rating: 4.8,
    tags: ["go", "golang", "gopls", "debugging"],
    features: [
      "Go Modules & multi-workspace support",
      "Automated code formatting with gofmt",
      "Run benchmarks and tests inline",
    ],
  },
];

const STORAGE_INSTALLED_KEY = "zypercode_installed_extensions";
const STORAGE_ENABLED_KEY = "zypercode_enabled_extensions";

function readSavedInstalled(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_INSTALLED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function readSavedEnabled(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_ENABLED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistState(installed: Record<string, boolean>, enabled: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_INSTALLED_KEY, JSON.stringify(installed));
    localStorage.setItem(STORAGE_ENABLED_KEY, JSON.stringify(enabled));
  } catch {
    /* ignore */
  }
}

interface ExtensionsState {
  extensions: ZyperExtension[];
  searchQuery: string;
  selectedCategory: ExtensionCategory | "all" | "installed";
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ExtensionCategory | "all" | "installed") => void;
  installExtension: (id: string) => void;
  uninstallExtension: (id: string) => void;
  toggleExtensionEnabled: (id: string) => void;
  getInstalledCount: () => number;
  getEnabledCount: () => number;
}

export const useExtensionsStore = create<ExtensionsState>((set, get) => {
  const savedInstalled = readSavedInstalled();
  const savedEnabled = readSavedEnabled();

  const initialExtensions = REGISTRY.map((ext) => {
    const isInstalled = savedInstalled[ext.id] ?? ext.installed;
    const isEnabled = savedEnabled[ext.id] ?? (isInstalled ? ext.enabled : false);
    return {
      ...ext,
      installed: isInstalled,
      enabled: isEnabled,
    };
  });

  const saveCurrent = (exts: ZyperExtension[]) => {
    const installedMap: Record<string, boolean> = {};
    const enabledMap: Record<string, boolean> = {};
    for (const item of exts) {
      installedMap[item.id] = item.installed;
      enabledMap[item.id] = item.enabled;
    }
    persistState(installedMap, enabledMap);
  };

  return {
    extensions: initialExtensions,
    searchQuery: "",
    selectedCategory: "all",

    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

    installExtension: (id) => {
      set((state) => {
        const next = state.extensions.map((ext) =>
          ext.id === id ? { ...ext, installed: true, enabled: true } : ext,
        );
        saveCurrent(next);
        return { extensions: next };
      });
    },

    uninstallExtension: (id) => {
      set((state) => {
        const next = state.extensions.map((ext) =>
          ext.id === id ? { ...ext, installed: false, enabled: false } : ext,
        );
        saveCurrent(next);
        return { extensions: next };
      });
    },

    toggleExtensionEnabled: (id) => {
      set((state) => {
        const next = state.extensions.map((ext) =>
          ext.id === id ? { ...ext, enabled: !ext.enabled } : ext,
        );
        saveCurrent(next);
        return { extensions: next };
      });
    },

    getInstalledCount: () => {
      return get().extensions.filter((e) => e.installed).length;
    },

    getEnabledCount: () => {
      return get().extensions.filter((e) => e.installed && e.enabled).length;
    },
  };
});

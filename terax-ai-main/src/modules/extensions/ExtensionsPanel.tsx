import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { openSettingsWindow } from "@/modules/settings/openSettingsWindow";
import { usePreferencesStore } from "@/modules/settings/preferences";
import {
  Cancel01Icon,
  Download04Icon,
  Search01Icon,
  Settings01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { useExtensionsStore } from "./extensionsStore";
import type { ExtensionCategory, ZyperExtension } from "./types";

export function ExtensionsPanel() {
  const enableExtensions = usePreferencesStore((s) => s.enableExtensions);
  const {
    extensions,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    installExtension,
    uninstallExtension,
    toggleExtensionEnabled,
  } = useExtensionsStore();

  const [filterView, setFilterView] = useState<"all" | "installed">("all");

  const filtered = useMemo(() => {
    return extensions.filter((ext) => {
      if (filterView === "installed" && !ext.installed) return false;
      if (selectedCategory !== "all" && selectedCategory !== "installed") {
        if (ext.category !== selectedCategory) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ext.name.toLowerCase().includes(q) ||
        ext.description.toLowerCase().includes(q) ||
        ext.publisher.toLowerCase().includes(q) ||
        (ext.tags && ext.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [extensions, filterView, selectedCategory, searchQuery]);

  // If user disabled extensions in settings, show an informative banner
  if (!enableExtensions) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground select-none">
        <div className="size-10 rounded-full bg-muted/30 flex items-center justify-center mb-3">
          <HugeiconsIcon icon={Settings01Icon} size={20} className="text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Extensions Support is Disabled</h3>
        <p className="text-xs text-muted-foreground max-w-[220px] mb-4 leading-relaxed">
          Extensions are turned off by default for privacy and performance. You can enable them anytime in Settings.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void openSettingsWindow("extensions")}
          className="text-xs gap-1.5"
        >
          Open Extensions Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background select-none overflow-hidden">
      {/* Search Header */}
      <div className="flex flex-col gap-2 p-2.5 border-b border-border/50">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extensions in marketplace…"
            className="h-8 pl-8 pr-7 text-xs bg-muted/30 border-border/60 focus:bg-background"
          />
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={12} />
            </button>
          ) : null}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => {
              setFilterView("all");
              setSelectedCategory("all");
            }}
            className={cn(
              "px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors whitespace-nowrap",
              filterView === "all" && selectedCategory === "all"
                ? "bg-foreground/[0.09] text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterView("installed");
              setSelectedCategory("installed");
            }}
            className={cn(
              "px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors whitespace-nowrap",
              filterView === "installed"
                ? "bg-foreground/[0.09] text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
            )}
          >
            Installed
          </button>
          {(["languages", "formatters", "tools", "themes"] as ExtensionCategory[]).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setFilterView("all");
                  setSelectedCategory(cat);
                }}
                className={cn(
                  "px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors capitalize whitespace-nowrap",
                  selectedCategory === cat && filterView === "all"
                    ? "bg-foreground/[0.09] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
                )}
              >
                {cat}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No extensions found matching &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filtered.map((ext) => (
            <ExtensionRow
              key={ext.id}
              extension={ext}
              onInstall={() => installExtension(ext.id)}
              onUninstall={() => uninstallExtension(ext.id)}
              onToggleEnabled={() => toggleExtensionEnabled(ext.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

type ExtensionRowProps = {
  extension: ZyperExtension;
  onInstall: () => void;
  onUninstall: () => void;
  onToggleEnabled: () => void;
};

function ExtensionRow({
  extension,
  onInstall,
  onUninstall,
  onToggleEnabled,
}: ExtensionRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "p-2.5 flex flex-col gap-1.5 transition-colors hover:bg-foreground/[0.02]",
        !extension.enabled && extension.installed && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon / Emoji badge */}
        <div className="size-8 rounded-lg bg-card border border-border/60 flex items-center justify-center text-base shrink-0 select-none shadow-sm">
          {extension.icon}
        </div>

        {/* Title & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-semibold text-foreground truncate cursor-pointer hover:underline"
            >
              {extension.name}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              v{extension.version}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-snug">
            {extension.description}
          </p>

          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/80">
            <span>{extension.publisher}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-0.5">
              <HugeiconsIcon icon={Download04Icon} size={10} />
              {extension.downloads}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-0.5">
              <HugeiconsIcon icon={StarIcon} size={10} className="text-[#E7B54D]" />
              {extension.rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 flex items-center gap-1 pt-0.5">
          {extension.installed ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={extension.enabled ? "secondary" : "outline"}
                onClick={onToggleEnabled}
                className="h-6 px-2 text-[10px] font-medium"
              >
                {extension.enabled ? "Disable" : "Enable"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onUninstall}
                title="Uninstall Extension"
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onInstall}
              className="h-6 px-2.5 text-[10px] font-medium bg-[#E7B54D] hover:bg-[#d49e35] text-[#0A0A0C] border-none"
            >
              Install
            </Button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && extension.features && (
        <div className="mt-1 pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground pl-10 space-y-1 animate-in fade-in duration-150">
          <div className="font-semibold text-foreground text-[10.5px]">Features:</div>
          <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
            {extension.features.map((feat, idx) => (
              <li key={idx}>{feat}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

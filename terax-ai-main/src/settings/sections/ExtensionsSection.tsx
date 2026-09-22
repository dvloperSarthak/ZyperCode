import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useExtensionsStore } from "@/modules/extensions";
import { usePreferencesStore } from "@/modules/settings/preferences";
import { setEnableExtensions } from "@/modules/settings/store";
import {
  Download04Icon,
  PuzzleIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SectionHeader } from "../components/SectionHeader";
import { SettingRow } from "../components/SettingRow";

export function ExtensionsSection() {
  const enableExtensions = usePreferencesStore((s) => s.enableExtensions);
  const {
    extensions,
    installExtension,
    uninstallExtension,
    toggleExtensionEnabled,
    getInstalledCount,
    getEnabledCount,
  } = useExtensionsStore();

  const installedCount = getInstalledCount();
  const enabledCount = getEnabledCount();

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[720px] mx-auto">
      <SectionHeader
        title="Extensions"
        description="Configure community and ecosystem extension capabilities in ZyperCode."
      />

      {/* Master Toggle */}
      <SettingRow
        title={
          <div className="flex items-center gap-2">
            <span>Enable Extension Support</span>
            <Badge
              variant="outline"
              className="h-4 border-[#E7B54D]/30 bg-[#E7B54D]/10 text-[10px] font-mono text-[#E7B54D]"
            >
              Beta
            </Badge>
          </div>
        }
        description="Activate extension ecosystem support, sidebar marketplace view, and language tooling. When disabled, all extension background processes and the sidebar rail icon remain completely inactive."
      >
        <Switch
          checked={enableExtensions}
          onCheckedChange={(checked) => void setEnableExtensions(checked)}
        />
      </SettingRow>

      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/60 bg-card/60 p-3 flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">Extension Support</span>
          <span className="text-sm font-semibold flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                enableExtensions ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-muted-foreground",
              )}
            />
            {enableExtensions ? "Active" : "Disabled"}
          </span>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/60 p-3 flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">Installed Extensions</span>
          <span className="text-sm font-semibold tabular-nums">
            {installedCount}
          </span>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/60 p-3 flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">Active / Enabled</span>
          <span className="text-sm font-semibold tabular-nums text-[#E7B54D]">
            {enableExtensions ? enabledCount : 0}
          </span>
        </div>
      </div>

      {/* Installed & Curated Extensions */}
      {enableExtensions ? (
        <div className="flex flex-col gap-2.5 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Installed &amp; Available Extensions
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              Marketplace sync active
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {extensions.map((ext) => (
              <div
                key={ext.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 p-3 transition-colors",
                  !ext.enabled && ext.installed && "opacity-60",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-background border border-border/60 flex items-center justify-center text-base shrink-0 select-none shadow-sm">
                    {ext.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {ext.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        v{ext.version}
                      </span>
                      {ext.installed && ext.enabled && (
                        <Badge
                          variant="outline"
                          className="h-3.5 border-emerald-500/30 bg-emerald-500/10 text-[9px] font-mono text-emerald-400 px-1"
                        >
                          Enabled
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {ext.description}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground/80">
                      <span>{ext.publisher}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5">
                        <HugeiconsIcon icon={Download04Icon} size={10} />
                        {ext.downloads}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5">
                        <HugeiconsIcon
                          icon={StarIcon}
                          size={10}
                          className="text-[#E7B54D]"
                        />
                        {ext.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ext.installed ? (
                    <>
                      <Switch
                        checked={ext.enabled}
                        onCheckedChange={() => toggleExtensionEnabled(ext.id)}
                        aria-label={`Toggle ${ext.name}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => uninstallExtension(ext.id)}
                        className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                      >
                        Uninstall
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => installExtension(ext.id)}
                      className="h-7 px-3 text-[11px] font-medium bg-[#E7B54D] hover:bg-[#d49e35] text-[#0A0A0C] border-none"
                    >
                      Install
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/80 bg-card/30 p-8 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <HugeiconsIcon icon={PuzzleIcon} size={28} className="text-muted-foreground/50" />
          <span className="text-xs font-medium text-foreground">
            Extensions are currently disabled
          </span>
          <span className="text-[11px] text-muted-foreground max-w-[320px] leading-relaxed">
            Turn on the switch above to enable the Extensions marketplace and view extension tools on the sidebar rail.
          </span>
        </div>
      )}
    </div>
  );
}

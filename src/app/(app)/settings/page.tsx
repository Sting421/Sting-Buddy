"use client";

import { useState } from "react";
import { Settings as SettingsIcon, Palette, Clock, Zap, Volume2, Bell, Database } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/lib/hooks";
import { api, type EnergyLevel } from "@/lib/db";
import { cn } from "@/lib/utils";

const energyLevels: { value: EnergyLevel; label: string; emoji: string }[] = [
  { value: "deep", label: "Deep Focus", emoji: "🧠" },
  { value: "medium", label: "Medium", emoji: "⚡" },
  { value: "shallow", label: "Shallow", emoji: "🍃" },
];

export default function SettingsPage() {
  const settings = useSettings();
  const [exportStatus, setExportStatus] = useState<string>("");

  if (!settings) return null;

  async function updateSetting(key: string, value: unknown) {
    await api.updateSettings({ [key]: value } as Record<string, unknown>);
  }

  async function exportData() {
    const res = await fetch("/api/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stingbuddy-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus("Exported!");
    setTimeout(() => setExportStatus(""), 2000);
  }

  async function clearAllData() {
    if (!confirm("Are you sure? This will delete ALL your data. This cannot be undone.")) return;
    await fetch("/api/clear", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-neon/10">
          <SettingsIcon size={20} className="text-neon" />
        </div>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Section icon={Palette} title="Appearance">
          <SettingRow label="Theme">
            <Select
              value={settings.theme}
              onValueChange={(v) => updateSetting("theme", v)}
            >
              <SelectTrigger className="w-36 h-8 text-xs bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark" className="text-xs">Dark</SelectItem>
                <SelectItem value="light" className="text-xs">Light</SelectItem>
                <SelectItem value="system" className="text-xs">System</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </Section>

        <Separator />

        {/* Time & Planning */}
        <Section icon={Clock} title="Time & Planning">
          <SettingRow label="Default estimate (min)">
            <Input
              type="number"
              value={settings.defaultEstimateMinutes}
              onChange={(e) => updateSetting("defaultEstimateMinutes", parseInt(e.target.value) || 25)}
              className="w-20 h-8 text-xs bg-secondary/50"
            />
          </SettingRow>
          <SettingRow label="Daily capacity (min)">
            <Input
              type="number"
              value={settings.dailyCapacityMinutes}
              onChange={(e) => updateSetting("dailyCapacityMinutes", parseInt(e.target.value) || 480)}
              className="w-20 h-8 text-xs bg-secondary/50"
            />
          </SettingRow>
          <SettingRow label="Week starts on">
            <Select
              value={String(settings.weekStartsOn)}
              onValueChange={(v) => updateSetting("weekStartsOn", parseInt(v ?? "1"))}
            >
              <SelectTrigger className="w-36 h-8 text-xs bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">Sunday</SelectItem>
                <SelectItem value="1" className="text-xs">Monday</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Capacity warning">
            <Checkbox
              checked={settings.showCapacityWarning}
              onCheckedChange={(v) => updateSetting("showCapacityWarning", !!v)}
            />
          </SettingRow>
        </Section>

        <Separator />

        {/* Energy curve */}
        <Section icon={Zap} title="Energy Curve">
          <p className="text-xs text-muted-foreground mb-3">
            Set your typical energy level by time of day. The auto-scheduler will match tasks to your energy.
          </p>
          {(["morning", "midday", "afternoon", "evening"] as const).map((period) => (
            <SettingRow key={period} label={period.charAt(0).toUpperCase() + period.slice(1)}>
              <Select
                value={settings.energyCurve[period]}
                onValueChange={(v) =>
                  updateSetting("energyCurve", {
                    ...settings.energyCurve,
                    [period]: v,
                  })
                }
              >
                <SelectTrigger className="w-36 h-8 text-xs bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {energyLevels.map((e) => (
                    <SelectItem key={e.value} value={e.value} className="text-xs">
                      {e.emoji} {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          ))}
        </Section>

        <Separator />

        {/* Blitz Mode */}
        <Section icon={Volume2} title="Blitz Mode">
          <SettingRow label="Default soundscape">
            <Select
              value={settings.blitzSoundscape}
              onValueChange={(v) => updateSetting("blitzSoundscape", v)}
            >
              <SelectTrigger className="w-36 h-8 text-xs bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">Silence</SelectItem>
                <SelectItem value="rain" className="text-xs">Rain</SelectItem>
                <SelectItem value="cafe" className="text-xs">Cafe</SelectItem>
                <SelectItem value="nature" className="text-xs">Nature</SelectItem>
                <SelectItem value="brown" className="text-xs">Brown Noise</SelectItem>
                <SelectItem value="white" className="text-xs">White Noise</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Completion sound">
            <Checkbox
              checked={settings.completionSound}
              onCheckedChange={(v) => updateSetting("completionSound", !!v)}
            />
          </SettingRow>
          <SettingRow label="Completion animation">
            <Checkbox
              checked={settings.completionAnimation}
              onCheckedChange={(v) => updateSetting("completionAnimation", !!v)}
            />
          </SettingRow>
        </Section>

        <Separator />

        {/* Data */}
        <Section icon={Database} title="Data">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={exportData}>
              Export Data
            </Button>
            {exportStatus && (
              <span className="text-xs text-neon">{exportStatus}</span>
            )}
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={clearAllData}
            >
              Clear All Data
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Icon size={14} className="text-neon" />
        {title}
      </h2>
      <div className="space-y-3 pl-6">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, WifiOff, Zap, Plus, Filter, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore, useBlitzStore, useWorkspaceStore } from "@/lib/store";
import { useCompletedToday } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const pageTitles: Record<string, string> = {
  "/inbox": "Inbox",
  "/today": "My Work",
  "/blitz": "Blitz Mode",
  "/upcoming": "Upcoming",
  "/schedule": "Schedule",
  "/board": "Board",
  "/stats": "Stats",
  "/settings": "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOffline, setCommandPaletteOpen, setQuickAddOpen } = useUIStore();
  const { streak } = useBlitzStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const completedToday = useCompletedToday(activeWorkspaceId);

  const title = pageTitles[pathname] ?? "StingBuddy";

  return (
    <header className="flex items-center justify-between h-11 px-4 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Add new task button */}
        <Button
          onClick={() => setQuickAddOpen(true)}
          size="sm"
          className="bg-neon text-background hover:bg-neon/90 h-7 text-xs font-medium px-3 rounded-md"
        >
          <Plus size={13} className="mr-1" />
          Add new
        </Button>

        {/* Today button */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2.5"
          onClick={() => router.push("/today")}
        >
          Today
        </Button>

        {/* Streak counter */}
        {completedToday.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-neon/10 text-neon text-[11px] font-medium">
            <Zap size={11} />
            <span>{completedToday.length} done</span>
          </div>
        )}

        {streak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning text-[11px] font-medium">
            🔥 {streak}
          </div>
        )}

        {/* Offline indicator */}
        {isOffline && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-medium">
            <WifiOff size={11} />
            Offline
          </div>
        )}

        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-muted-foreground text-[11px] hover:bg-accent hover:text-foreground transition-colors"
        >
          <Search size={12} />
          <kbd className="text-[9px] bg-muted px-1 rounded">⌘K</kbd>
        </button>
      </div>
    </header>
  );
}

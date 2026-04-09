"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Inbox,
  Sun,
  Zap,
  Settings,
  Plus,
  FolderOpen,
  BarChart3,
  Calendar,
  Search,
  Columns3,
  CalendarDays,
} from "lucide-react";
import { useUIStore, useWorkspaceStore } from "@/lib/store";
import { useAllProjects } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  keywords?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, setQuickAddOpen } = useUIStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const projects = useAllProjects(activeWorkspaceId);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [taskResults, setTaskResults] = useState<{ id: string; title: string }[]>([]);

  // Search tasks when query changes
  useEffect(() => {
    if (query.length < 2 || !activeWorkspaceId) {
      setTaskResults([]);
      return;
    }
    fetch(`/api/tasks?workspaceId=${activeWorkspaceId}&search=${encodeURIComponent(query)}&limit=5`)
      .then((r) => r.json())
      .then((results) => setTaskResults(results.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title }))));
  }, [query, activeWorkspaceId]);

  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: "new-task",
        label: "New Task",
        icon: <Plus size={16} />,
        action: () => {
          setCommandPaletteOpen(false);
          setQuickAddOpen(true);
        },
        category: "Actions",
        keywords: "create add task",
      },
      {
        id: "nav-inbox",
        label: "Go to Inbox",
        icon: <Inbox size={16} />,
        action: () => router.push("/inbox"),
        category: "Navigation",
        keywords: "inbox unsorted",
      },
      {
        id: "nav-today",
        label: "Go to Today",
        icon: <Sun size={16} />,
        action: () => router.push("/today"),
        category: "Navigation",
        keywords: "today queue",
      },
      {
        id: "nav-blitz",
        label: "Start Blitz Mode",
        icon: <Zap size={16} />,
        action: () => router.push("/blitz"),
        category: "Navigation",
        keywords: "blitz focus timer",
      },
      {
        id: "nav-schedule",
        label: "Go to Schedule",
        icon: <CalendarDays size={16} />,
        action: () => router.push("/schedule"),
        category: "Navigation",
        keywords: "schedule week timeline calendar",
      },
      {
        id: "nav-board",
        label: "Go to Board",
        icon: <Columns3 size={16} />,
        action: () => router.push("/board"),
        category: "Navigation",
        keywords: "kanban board columns",
      },
      {
        id: "nav-upcoming",
        label: "Go to Upcoming",
        icon: <Calendar size={16} />,
        action: () => router.push("/upcoming"),
        category: "Navigation",
      },
      {
        id: "nav-stats",
        label: "Go to Stats",
        icon: <BarChart3 size={16} />,
        action: () => router.push("/stats"),
        category: "Navigation",
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        icon: <Settings size={16} />,
        action: () => router.push("/settings"),
        category: "Navigation",
      },
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        label: p.name,
        icon: <FolderOpen size={16} />,
        action: () => router.push(`/project/${p.id}`),
        category: "Projects",
        keywords: "project",
      })),
      ...taskResults.map((t) => ({
        id: `task-${t.id}`,
        label: t.title,
        icon: <Search size={16} />,
        action: () => {
          setCommandPaletteOpen(false);
          useUIStore.getState().setTaskDetailId(t.id);
        },
        category: "Tasks",
      })),
    ];
    return items;
  }, [projects, taskResults, router, setCommandPaletteOpen, setQuickAddOpen]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(lower) ||
        c.keywords?.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  // Reset selection when filtered changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      setCommandPaletteOpen(false);
    }
  }

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const group = map.get(item.category) ?? [];
      group.push(item);
      map.set(item.category, group);
    }
    return map;
  }, [filtered]);

  let flatIndex = 0;

  return (
    <Dialog
      open={commandPaletteOpen}
      onOpenChange={(open) => {
        setCommandPaletteOpen(open);
        if (!open) setQuery("");
      }}
    >
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden border-border bg-popover">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              {items.map((item) => {
                const idx = flatIndex++;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setCommandPaletteOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors",
                      idx === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/80 hover:bg-accent/50"
                    )}
                  >
                    <span className="text-muted-foreground">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

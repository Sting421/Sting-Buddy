"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  Sun,
  Zap,
  FolderOpen,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Calendar,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  CalendarDays,
  Search,
  Users,
  Columns3,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUIStore, useWorkspaceStore } from "@/lib/store";
import { useSpaces, useAllProjects, useInboxTasks, useTodayTasks } from "@/lib/hooks";
import { api } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";

const mainNav = [
  { href: "/today", icon: Sun, label: "My Work", countKey: "today" as const },
  { href: "/schedule", icon: CalendarDays, label: "Schedule", countKey: null },
  { href: "/inbox", icon: Inbox, label: "Inbox", countKey: "inbox" as const },
  { href: "/board", icon: Columns3, label: "Board", countKey: null },
  { href: "/blitz", icon: Zap, label: "Blitz Mode", countKey: null },
];

const bottomNav = [
  { href: "/stats", icon: BarChart3, label: "Stats" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const spaces = useSpaces(activeWorkspaceId);
  const projects = useAllProjects(activeWorkspaceId);
  const inboxTasks = useInboxTasks(activeWorkspaceId);
  const todayTasks = useTodayTasks(activeWorkspaceId);
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const counts = {
    inbox: inboxTasks.length,
    today: todayTasks.length,
  };

  function toggleSpace(id: string) {
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createProject(spaceId: string) {
    if (!activeWorkspaceId) return;
    const project = await api.createProject({
      spaceId,
      workspaceId: activeWorkspaceId,
      name: "New Project",
      status: "active",
      order: projects.filter((p) => p.spaceId === spaceId).length,
    });
    router.push(`/project/${project.id}`);
  }

  // Collapsed sidebar
  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center w-12 border-r border-border bg-sidebar py-3 gap-1.5">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors mb-2"
        >
          <PanelLeft size={18} />
        </button>
        {mainNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "relative p-1.5 rounded-md transition-colors",
                isActive
                  ? "bg-neon/10 text-neon"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={item.label}
            >
              <item.icon size={18} />
              {item.countKey && counts[item.countKey] > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-neon text-background text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {counts[item.countKey]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-56 border-r border-border bg-sidebar shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐝</span>
          <span className="font-bold text-sm text-neon">StingBuddy</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <button
          onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md bg-sidebar-accent/50 text-muted-foreground text-xs hover:bg-sidebar-accent transition-colors"
        >
          <Search size={13} />
          <span>Search...</span>
          <kbd className="ml-auto text-[9px] bg-sidebar-accent px-1 rounded">⌘K</kbd>
        </button>
      </div>

      <ScrollArea className="flex-1">
        {/* Main navigation */}
        <div className="px-2 py-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-[13px] transition-all group",
                  isActive
                    ? "bg-neon/10 text-neon font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  size={15}
                  className={cn(
                    isActive
                      ? "text-neon"
                      : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60"
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.countKey && counts[item.countKey] > 0 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-[18px] text-center",
                      isActive
                        ? "bg-neon/20 text-neon"
                        : "bg-sidebar-accent text-muted-foreground"
                    )}
                  >
                    {counts[item.countKey]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-3 py-1.5">
          <div className="h-px bg-border" />
        </div>

        {/* Projects section */}
        <div className="px-2 py-1">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center justify-between w-full px-2.5 py-1 group"
          >
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Projects
            </span>
            <div className="flex items-center gap-1">
              {spaces.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createProject(spaces[0].id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-accent transition-opacity"
                >
                  <Plus size={12} className="text-muted-foreground" />
                </button>
              )}
              {projectsExpanded ? (
                <ChevronDown size={12} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={12} className="text-muted-foreground" />
              )}
            </div>
          </button>

          {projectsExpanded &&
            spaces.map((space) => {
              const spaceProjects = projects.filter((p) => p.spaceId === space.id);
              return (
                <div key={space.id}>
                  {spaceProjects.map((project) => {
                    const isActive = pathname === `/project/${project.id}`;
                    return (
                      <button
                        key={project.id}
                        onClick={() => router.push(`/project/${project.id}`)}
                        className={cn(
                          "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                          isActive
                            ? "bg-neon/10 text-neon font-medium"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-sm shrink-0",
                            project.color ? "" : "bg-neon/50"
                          )}
                          style={project.color ? { backgroundColor: project.color } : undefined}
                        />
                        <span className="truncate">{project.name}</span>
                      </button>
                    );
                  })}
                  {spaceProjects.length === 0 && (
                    <div className="px-2.5 py-1 text-[11px] text-muted-foreground/40">
                      No projects yet
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </ScrollArea>

      {/* Bottom */}
      <div className="border-t border-border px-2 py-2 space-y-0.5">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                isActive
                  ? "bg-neon/10 text-neon font-medium"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

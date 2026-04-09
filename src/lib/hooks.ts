"use client";

import { useEffect } from "react";
import useSWR from "swr";
import type { Task, Project, Space, Workspace, UserSettings } from "./db";
import { useWorkspaceStore, useUIStore } from "./store";

// ─── SWR fetcher ─────────────────────────────────────────────────

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
  return res.json();
};

// ─── Data hooks ──────────────────────────────────────────────────

export function useWorkspaces(): Workspace[] {
  const { data } = useSWR<Workspace[]>("/api/workspaces", fetcher);
  return data ?? [];
}

export function useSpaces(workspaceId: string | null): Space[] {
  const { data } = useSWR<Space[]>(
    workspaceId ? `/api/spaces?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return data ?? [];
}

export function useProjects(spaceId: string | null): Project[] {
  const { data } = useSWR<Project[]>(
    spaceId ? `/api/projects?spaceId=${spaceId}` : null,
    fetcher
  );
  return data ?? [];
}

export function useAllProjects(workspaceId: string | null): Project[] {
  const { data } = useSWR<Project[]>(
    workspaceId ? `/api/projects?workspaceId=${workspaceId}` : null,
    fetcher
  );
  return data ?? [];
}

export function useInboxTasks(workspaceId: string | null): Task[] {
  const { data } = useSWR<Task[]>(
    workspaceId
      ? `/api/tasks?workspaceId=${workspaceId}&status=inbox&parentId=none`
      : null,
    fetcher
  );
  return data ?? [];
}

export function useTodayTasks(workspaceId: string | null): Task[] {
  const { data } = useSWR<Task[]>(
    workspaceId
      ? `/api/tasks?workspaceId=${workspaceId}&isInToday=true`
      : null,
    fetcher
  );
  return data ?? [];
}

export function useCompletedToday(workspaceId: string | null): Task[] {
  const { data } = useSWR<Task[]>(
    workspaceId
      ? `/api/tasks?workspaceId=${workspaceId}&completedToday=true`
      : null,
    fetcher
  );
  return data ?? [];
}

export function useProjectTasks(projectId: string | null): Task[] {
  const { data } = useSWR<Task[]>(
    projectId
      ? `/api/tasks?projectId=${projectId}&parentId=none`
      : null,
    fetcher
  );
  return data ?? [];
}

export function useSubtasks(parentId: string | null): Task[] {
  const { data } = useSWR<Task[]>(
    parentId ? `/api/tasks?parentId=${parentId}` : null,
    fetcher
  );
  return data ?? [];
}

export function useTask(taskId: string | null): Task | undefined {
  const { data } = useSWR<Task>(
    taskId ? `/api/tasks/${taskId}` : null,
    fetcher
  );
  return data ?? undefined;
}

export function useSettings(): UserSettings | undefined {
  const { data } = useSWR<UserSettings>("/api/settings", fetcher);
  if (!data) return undefined;
  // Map flat DB fields to nested energyCurve object
  const raw = data as unknown as Record<string, unknown>;
  return {
    ...data,
    energyCurve: {
      morning: (raw.energyCurveMorning as string) ?? "deep",
      midday: (raw.energyCurveMidday as string) ?? "medium",
      afternoon: (raw.energyCurveAfternoon as string) ?? "shallow",
      evening: (raw.energyCurveEvening as string) ?? "shallow",
    },
  } as UserSettings;
}

export function useBoardTasks(workspaceId: string | null): Task[] {
  const { data } = useSWR<Task[]>(
    workspaceId
      ? `/api/tasks?workspaceId=${workspaceId}&parentId=none`
      : null,
    fetcher
  );
  return (data ?? []).filter((t) => t.status !== "cancelled");
}

// ─── Keyboard shortcut hook ───────────────────────────────────────

export function useKeyboardShortcuts() {
  const { setQuickAddOpen, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setQuickAddOpen, setCommandPaletteOpen]);
}

// ─── Online/offline detection ─────────────────────────────────────

export function useOnlineStatus() {
  const { setIsOffline } = useUIStore();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOffline]);
}

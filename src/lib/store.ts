import { create } from "zustand";
import type { Task, Project, Space, Workspace, UserSettings, ViewType } from "./db";

// ─── UI Store ─────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  quickAddOpen: boolean;
  taskDetailId: string | null;
  activeView: ViewType;
  isOffline: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickAddOpen: (open: boolean) => void;
  setTaskDetailId: (id: string | null) => void;
  setActiveView: (view: ViewType) => void;
  setIsOffline: (offline: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  quickAddOpen: false,
  taskDetailId: null,
  activeView: "list",
  isOffline: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  setTaskDetailId: (id) => set({ taskDetailId: id }),
  setActiveView: (view) => set({ activeView: view }),
  setIsOffline: (offline) => set({ isOffline: offline }),
}));

// ─── Blitz Store ──────────────────────────────────────────────────

interface BlitzState {
  isActive: boolean;
  currentTaskId: string | null;
  queue: string[]; // task IDs
  timeRemaining: number; // seconds
  isPaused: boolean;
  soundscape: string;
  streak: number;
  sessionsToday: number;

  startBlitz: (taskId: string, queue: string[], estimateSeconds: number) => void;
  pauseBlitz: () => void;
  resumeBlitz: () => void;
  skipTask: () => void;
  completeTask: () => void;
  stopBlitz: () => void;
  tick: () => void;
  setSoundscape: (sound: string) => void;
  extendTime: (seconds: number) => void;
}

export const useBlitzStore = create<BlitzState>((set, get) => ({
  isActive: false,
  currentTaskId: null,
  queue: [],
  timeRemaining: 0,
  isPaused: false,
  soundscape: "rain",
  streak: 0,
  sessionsToday: 0,

  startBlitz: (taskId, queue, estimateSeconds) =>
    set({
      isActive: true,
      currentTaskId: taskId,
      queue,
      timeRemaining: estimateSeconds,
      isPaused: false,
    }),

  pauseBlitz: () => set({ isPaused: true }),
  resumeBlitz: () => set({ isPaused: false }),

  skipTask: () => {
    const { queue } = get();
    const nextQueue = queue.slice(1);
    if (nextQueue.length === 0) {
      set({ isActive: false, currentTaskId: null, queue: [], timeRemaining: 0 });
    } else {
      set({ currentTaskId: nextQueue[0], queue: nextQueue, timeRemaining: 25 * 60 });
    }
  },

  completeTask: () => {
    const { queue, sessionsToday, streak } = get();
    const nextQueue = queue.slice(1);
    if (nextQueue.length === 0) {
      set({
        isActive: false,
        currentTaskId: null,
        queue: [],
        timeRemaining: 0,
        sessionsToday: sessionsToday + 1,
        streak: streak + 1,
      });
    } else {
      set({
        currentTaskId: nextQueue[0],
        queue: nextQueue,
        timeRemaining: 25 * 60,
        sessionsToday: sessionsToday + 1,
        streak: streak + 1,
      });
    }
  },

  stopBlitz: () =>
    set({
      isActive: false,
      currentTaskId: null,
      queue: [],
      timeRemaining: 0,
      isPaused: false,
    }),

  tick: () => {
    const { timeRemaining, isPaused } = get();
    if (!isPaused && timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  setSoundscape: (sound) => set({ soundscape: sound }),
  extendTime: (seconds) => set((s) => ({ timeRemaining: s.timeRemaining + seconds })),
}));

// ─── Workspace Store ──────────────────────────────────────────────

interface WorkspaceState {
  activeWorkspaceId: string | null;
  activeSpaceId: string | null;
  activeProjectId: string | null;

  setActiveWorkspace: (id: string) => void;
  setActiveSpace: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  activeSpaceId: null,
  activeProjectId: null,

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
  setActiveSpace: (id) => set({ activeSpaceId: id }),
  setActiveProject: (id) => set({ activeProjectId: id }),
}));

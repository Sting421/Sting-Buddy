// ─── Types ────────────────────────────────────────────────────────

export type Priority = "none" | "low" | "medium" | "high" | "urgent";
export type EnergyLevel = "deep" | "medium" | "shallow";
export type TaskStatus = "inbox" | "todo" | "in_progress" | "done" | "cancelled";
export type ViewType = "list" | "board" | "calendar" | "timeline" | "gallery";

export interface Workspace {
  id: string;
  name: string;
  emoji?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Space {
  id: string;
  workspaceId: string;
  name: string;
  emoji?: string;
  color?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  spaceId: string;
  workspaceId: string;
  name: string;
  emoji?: string;
  color?: string;
  description?: string;
  targetDate?: Date;
  status: "active" | "paused" | "completed" | "archived";
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  parentId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date | null;
  scheduledDate?: Date | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  energyLevel?: EnergyLevel | null;
  tags: string[];
  contexts: string[];
  order: number;
  todayOrder?: number | null;
  isInToday: boolean;
  recurrenceRule?: string | null;
  calendarEventId?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
}

export interface DailyReview {
  id: string;
  workspaceId: string;
  date: string;
  whatGotDone: string;
  whatDidnt: string;
  tomorrowPriority: string;
  createdAt: Date;
}

export interface UserSettings {
  id: string;
  theme: "dark" | "light" | "system";
  defaultView: ViewType;
  blitzSoundscape: string;
  completionSound: boolean;
  completionAnimation: boolean;
  energyCurve: {
    morning: EnergyLevel;
    midday: EnergyLevel;
    afternoon: EnergyLevel;
    evening: EnergyLevel;
  };
  weekStartsOn: 0 | 1;
  defaultEstimateMinutes: number;
  showCapacityWarning: boolean;
  dailyCapacityMinutes: number;
}

// ─── API helpers ─────────────────────────────────────────────────

const API = "/api";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Seed
  seed: () => apiFetch<{ workspaces: Workspace[] }>("/seed", { method: "POST" }),

  // Workspaces
  getWorkspaces: () => apiFetch<Workspace[]>("/workspaces"),

  // Spaces
  getSpaces: (workspaceId: string) => apiFetch<Space[]>(`/spaces?workspaceId=${workspaceId}`),

  // Projects
  getProjects: (params: { workspaceId?: string; spaceId?: string }) => {
    const sp = new URLSearchParams();
    if (params.workspaceId) sp.set("workspaceId", params.workspaceId);
    if (params.spaceId) sp.set("spaceId", params.spaceId);
    return apiFetch<Project[]>(`/projects?${sp}`);
  },
  createProject: (data: Partial<Project>) =>
    apiFetch<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),

  // Tasks
  getTasks: (params: Record<string, string>) => {
    const sp = new URLSearchParams(params);
    return apiFetch<Task[]>(`/tasks?${sp}`);
  },
  getTask: (id: string) => apiFetch<Task>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) =>
    apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task>) =>
    apiFetch<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    apiFetch<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" }),

  // Settings
  getSettings: () => apiFetch<UserSettings | null>("/settings"),
  updateSettings: (data: Partial<UserSettings>) =>
    apiFetch<UserSettings>("/settings", { method: "PATCH", body: JSON.stringify(data) }),
};

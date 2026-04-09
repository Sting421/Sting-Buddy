import { api, type Task, type Priority, type EnergyLevel } from "./db";
import { addDays } from "date-fns";
import { mutate } from "swr";

// Revalidate all task-related SWR keys
function revalidateTasks() {
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/tasks"), undefined, { revalidate: true });
}

// ─── CRUD ─────────────────────────────────────────────────────────

export async function createTask(
  partial: Partial<Task> & { title: string; workspaceId: string }
): Promise<Task> {
  const task = await api.createTask(partial);
  revalidateTasks();
  return task;
}

export async function updateTask(id: string, changes: Partial<Task>) {
  await api.updateTask(id, changes);
  revalidateTasks();
}

export async function deleteTask(id: string) {
  await api.deleteTask(id);
  revalidateTasks();
}

export async function completeTask(id: string) {
  await api.updateTask(id, {
    status: "done",
    completedAt: new Date(),
  } as Partial<Task>);
  revalidateTasks();
}

export async function addToToday(id: string) {
  await api.updateTask(id, {
    isInToday: true,
    todayOrder: Date.now(), // Use timestamp as order
  } as Partial<Task>);
  revalidateTasks();
}

export async function removeFromToday(id: string) {
  await api.updateTask(id, {
    isInToday: false,
    todayOrder: null,
  } as Partial<Task>);
  revalidateTasks();
}

// ─── NLP Parser (local, no API) ──────────────────────────────────

interface ParsedTask {
  title: string;
  priority?: Priority;
  dueDate?: Date;
  scheduledDate?: Date;
  estimatedMinutes?: number;
  tags: string[];
  contexts: string[];
  energyLevel?: EnergyLevel;
}

export function parseNaturalLanguage(input: string): ParsedTask {
  let remaining = input.trim();
  const tags: string[] = [];
  const contexts: string[] = [];
  let priority: Priority | undefined;
  let dueDate: Date | undefined;
  let scheduledDate: Date | undefined;
  let estimatedMinutes: number | undefined;
  let energyLevel: EnergyLevel | undefined;

  // Extract priority: !high, !urgent, !low, !medium
  const priorityMatch = remaining.match(/!(urgent|high|medium|low)/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase() as Priority;
    remaining = remaining.replace(priorityMatch[0], "");
  }

  // Extract tags: #tag
  const tagMatches = remaining.matchAll(/#(\w[\w-]*)/g);
  for (const match of tagMatches) {
    tags.push(match[1]);
    remaining = remaining.replace(match[0], "");
  }

  // Extract contexts: @context
  const contextMatches = remaining.matchAll(/@(\w[\w-]*)/g);
  for (const match of contextMatches) {
    contexts.push(`@${match[1]}`);
    remaining = remaining.replace(match[0], "");
  }

  // Extract time estimate: 30m, 1h, 1.5h, 90min
  const timeMatch = remaining.match(/(\d+(?:\.\d+)?)\s*(m(?:in)?|h(?:r|our)?s?)\b/i);
  if (timeMatch) {
    const num = parseFloat(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    estimatedMinutes = unit.startsWith("h") ? Math.round(num * 60) : Math.round(num);
    remaining = remaining.replace(timeMatch[0], "");
  }

  // Extract energy: ~deep, ~medium, ~shallow
  const energyMatch = remaining.match(/~(deep|medium|shallow)/i);
  if (energyMatch) {
    energyLevel = energyMatch[1].toLowerCase() as EnergyLevel;
    remaining = remaining.replace(energyMatch[0], "");
  }

  // Extract dates: today, tomorrow, monday-sunday
  const today = new Date();
  const datePatterns: [RegExp, () => Date][] = [
    [/\btoday\b/i, () => today],
    [/\btomorrow\b/i, () => addDays(today, 1)],
    [/\bmonday\b/i, () => getNextWeekday(1)],
    [/\btuesday\b/i, () => getNextWeekday(2)],
    [/\bwednesday\b/i, () => getNextWeekday(3)],
    [/\bthursday\b/i, () => getNextWeekday(4)],
    [/\bfriday\b/i, () => getNextWeekday(5)],
    [/\bsaturday\b/i, () => getNextWeekday(6)],
    [/\bsunday\b/i, () => getNextWeekday(0)],
  ];

  for (const [pattern, getDate] of datePatterns) {
    if (pattern.test(remaining)) {
      scheduledDate = getDate();
      remaining = remaining.replace(pattern, "");
      break;
    }
  }

  // Extract "due" keyword for due date
  const dueMatch = remaining.match(/\bdue\s+(today|tomorrow|\w+day)\b/i);
  if (dueMatch) {
    const dateStr = dueMatch[1].toLowerCase();
    if (dateStr === "today") dueDate = today;
    else if (dateStr === "tomorrow") dueDate = addDays(today, 1);
    remaining = remaining.replace(dueMatch[0], "");
  }

  const title = remaining.replace(/\s+/g, " ").trim();

  return {
    title,
    priority,
    dueDate,
    scheduledDate,
    estimatedMinutes,
    tags,
    contexts,
    energyLevel,
  };
}

function getNextWeekday(dayOfWeek: number): Date {
  const today = new Date();
  const diff = (dayOfWeek - today.getDay() + 7) % 7 || 7;
  return addDays(today, diff);
}

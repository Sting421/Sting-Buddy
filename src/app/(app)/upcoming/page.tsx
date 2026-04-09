"use client";

import { Calendar, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { TaskCard } from "@/components/task/task-card";
import { useWorkspaceStore } from "@/lib/store";
import type { Task } from "@/lib/db";
import {
  isToday,
  isTomorrow,
  startOfDay,
  isThisWeek,
} from "date-fns";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UpcomingPage() {
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: allTasks = [] } = useSWR<Task[]>(
    activeWorkspaceId
      ? `/api/tasks?workspaceId=${activeWorkspaceId}`
      : null,
    fetcher
  );

  const tasks = allTasks.filter(
    (t) =>
      t.status !== "done" &&
      t.status !== "cancelled" &&
      !!(t.scheduledDate || t.dueDate)
  );

  const today = new Date();

  const overdue = tasks.filter(
    (t) =>
      (t.dueDate && new Date(t.dueDate) < startOfDay(today)) ||
      (t.scheduledDate && new Date(t.scheduledDate) < startOfDay(today))
  );

  const todayTasks = tasks.filter(
    (t) =>
      !overdue.includes(t) &&
      ((t.scheduledDate && isToday(new Date(t.scheduledDate))) ||
        (t.dueDate && isToday(new Date(t.dueDate))))
  );

  const tomorrowTasks = tasks.filter(
    (t) =>
      !overdue.includes(t) &&
      !todayTasks.includes(t) &&
      ((t.scheduledDate && isTomorrow(new Date(t.scheduledDate))) ||
        (t.dueDate && isTomorrow(new Date(t.dueDate))))
  );

  const thisWeekTasks = tasks.filter(
    (t) =>
      !overdue.includes(t) &&
      !todayTasks.includes(t) &&
      !tomorrowTasks.includes(t) &&
      ((t.scheduledDate && isThisWeek(new Date(t.scheduledDate))) ||
        (t.dueDate && isThisWeek(new Date(t.dueDate))))
  );

  const laterTasks = tasks.filter(
    (t) =>
      !overdue.includes(t) &&
      !todayTasks.includes(t) &&
      !tomorrowTasks.includes(t) &&
      !thisWeekTasks.includes(t)
  );

  const groups: { label: string; tasks: Task[] }[] = [];
  if (overdue.length > 0) groups.push({ label: "Overdue", tasks: overdue });
  if (todayTasks.length > 0) groups.push({ label: "Today", tasks: todayTasks });
  if (tomorrowTasks.length > 0) groups.push({ label: "Tomorrow", tasks: tomorrowTasks });
  if (thisWeekTasks.length > 0) groups.push({ label: "This Week", tasks: thisWeekTasks });
  if (laterTasks.length > 0) groups.push({ label: "Later", tasks: laterTasks });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-neon/10">
          <Calendar size={20} className="text-neon" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Upcoming</h1>
          <p className="text-xs text-muted-foreground">
            {tasks.length} scheduled task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.label} className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <ChevronRight size={12} />
            {group.label}
            <span className="text-muted-foreground/50 ml-1">({group.tasks.length})</span>
          </h2>
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {group.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar size={32} className="text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-medium mb-1">Nothing scheduled</h3>
          <p className="text-xs text-muted-foreground">Tasks with due dates or scheduled dates will appear here.</p>
        </motion.div>
      )}
    </div>
  );
}

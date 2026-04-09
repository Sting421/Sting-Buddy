"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore, useWorkspaceStore } from "@/lib/store";
import type { Task } from "@/lib/db";
import { createTask } from "@/lib/tasks";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useAllProjects } from "@/lib/hooks";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SchedulePage() {
  const { setTaskDetailId } = useUIStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const projects = useAllProjects(activeWorkspaceId);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const { data: allTasks = [] } = useSWR<Task[]>(
    activeWorkspaceId
      ? `/api/tasks?workspaceId=${activeWorkspaceId}&parentId=none`
      : null,
    fetcher
  );

  const tasks = allTasks.filter(
    (t) => t.status !== "cancelled" && !!(t.scheduledDate || t.isInToday)
  );

  function getTasksForDay(date: Date) {
    return tasks.filter(
      (t) =>
        (t.scheduledDate && isSameDay(new Date(t.scheduledDate), date)) ||
        (t.isInToday && isToday(date))
    );
  }

  function getTotalMinutes(dayTasks: Task[]) {
    return dayTasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
  }

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  const projectColorMap = useMemo(() => {
    const colors = [
      "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      "bg-purple-500/20 text-purple-300 border-purple-500/30",
      "bg-amber-500/20 text-amber-300 border-amber-500/30",
      "bg-rose-500/20 text-rose-300 border-rose-500/30",
      "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    ];
    const map = new Map<string, string>();
    projects.forEach((p, i) => {
      map.set(p.id, colors[i % colors.length]);
    });
    return map;
  }, [projects]);

  function getProjectName(id?: string | null) {
    if (!id) return null;
    return projects.find((p) => p.id === id)?.name ?? null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/30">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-neon" />
          <span className="text-sm font-semibold">
            {format(weekStart, "MMMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft size={14} />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            This Week
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 min-w-[900px]">
          {weekDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const totalMin = getTotalMinutes(dayTasks);
            const today = isToday(day);

            return (
              <div key={day.toISOString()} className={cn("border-b border-r border-border px-2 py-2 text-center", today && "bg-neon/5")}>
                <div className={cn("text-[10px] font-medium uppercase tracking-wider", today ? "text-neon" : "text-muted-foreground")}>
                  {format(day, "EEE")}
                </div>
                <div className={cn("text-lg font-bold", today ? "text-neon" : "text-foreground")}>
                  {format(day, "d")}
                </div>
                {totalMin > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{formatDuration(totalMin)}</div>
                )}
              </div>
            );
          })}

          {weekDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const today = isToday(day);

            return (
              <div key={`col-${day.toISOString()}`} className={cn("border-r border-border min-h-[500px] p-1.5 space-y-1.5", today && "bg-neon/[0.02]")}>
                <AnimatePresence mode="popLayout">
                  {dayTasks.map((task) => {
                    const projectName = getProjectName(task.projectId);
                    const projectColor = task.projectId ? projectColorMap.get(task.projectId) : null;

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => setTaskDetailId(task.id)}
                        className={cn(
                          "group rounded-md border p-2 cursor-pointer transition-all hover:border-neon/30",
                          task.status === "done" ? "bg-neon/5 border-neon/20 opacity-60" : "bg-card/80 border-border/50 hover:bg-card"
                        )}
                      >
                        {task.scheduledDate && task.estimatedMinutes && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                            <Clock size={9} />
                            <span>
                              {format(new Date(task.scheduledDate), "HH:mm")} -{" "}
                              {format(new Date(new Date(task.scheduledDate).getTime() + task.estimatedMinutes * 60000), "HH:mm")}
                            </span>
                          </div>
                        )}
                        <div className={cn("text-xs font-medium leading-tight", task.status === "done" && "line-through text-muted-foreground")}>
                          {task.title}
                        </div>
                        {projectName && (
                          <div className="mt-1.5">
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-sm border", projectColor ?? "bg-secondary text-muted-foreground")}>
                              {projectName}
                            </span>
                          </div>
                        )}
                        {task.estimatedMinutes && !task.scheduledDate && (
                          <div className="text-[10px] text-muted-foreground mt-1">{formatDuration(task.estimatedMinutes)}</div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <button
                  onClick={() => {
                    if (!activeWorkspaceId) return;
                    createTask({ title: "New task", workspaceId: activeWorkspaceId, scheduledDate: day, status: "todo" }).then((t) => setTaskDetailId(t.id));
                  }}
                  className="flex items-center justify-center gap-1 w-full py-1.5 rounded-md border border-dashed border-border/40 text-[10px] text-muted-foreground/40 hover:border-neon/30 hover:text-neon/60 transition-colors opacity-0 group-hover:opacity-100"
                  style={{ opacity: dayTasks.length === 0 ? 0.5 : undefined }}
                >
                  <Plus size={10} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

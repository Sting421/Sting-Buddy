"use client";

import { BarChart3, CheckCircle2, Clock, Target, TrendingUp, Zap, Inbox } from "lucide-react";
import { motion } from "framer-motion";
import { useWorkspaceStore, useBlitzStore } from "@/lib/store";
import type { Task } from "@/lib/db";
import { isToday, subDays, format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StatsPage() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { sessionsToday } = useBlitzStore();

  const { data: allTasks = [] } = useSWR<Task[]>(
    activeWorkspaceId
      ? `/api/tasks?workspaceId=${activeWorkspaceId}`
      : null,
    fetcher
  );

  const completedToday = allTasks.filter(
    (t) => t.status === "done" && t.completedAt && isToday(new Date(t.completedAt))
  );
  const totalCompleted = allTasks.filter((t) => t.status === "done").length;
  const inboxCount = allTasks.filter((t) => t.status === "inbox").length;
  const activeCount = allTasks.filter(
    (t) => t.status === "todo" || t.status === "in_progress"
  ).length;

  const withBothTimes = allTasks.filter((t) => t.estimatedMinutes && t.actualMinutes);
  const avgAccuracy =
    withBothTimes.length > 0
      ? Math.round(
          withBothTimes.reduce(
            (sum, t) => sum + Math.min((t.estimatedMinutes! / t.actualMinutes!) * 100, 200),
            0
          ) / withBothTimes.length
        )
      : null;

  const focusMinutesToday = 0; // TODO: time entries API

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const start = startOfDay(date);
    const end = endOfDay(date);
    const count = allTasks.filter(
      (t) => t.status === "done" && t.completedAt && new Date(t.completedAt) >= start && new Date(t.completedAt) <= end
    ).length;
    return { date, label: format(date, "EEE"), count };
  });
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  const tagMultipliers: { tag: string; multiplier: number; samples: number }[] = [];
  const tagMap = new Map<string, { total: number; count: number }>();
  for (const task of withBothTimes) {
    const mult = task.actualMinutes! / task.estimatedMinutes!;
    for (const tag of task.tags) {
      const entry = tagMap.get(tag) ?? { total: 0, count: 0 };
      entry.total += mult;
      entry.count += 1;
      tagMap.set(tag, entry);
    }
  }
  for (const [tag, { total, count }] of tagMap) {
    if (count >= 3) {
      tagMultipliers.push({ tag, multiplier: Math.round((total / count) * 10) / 10, samples: count });
    }
  }

  const statCards = [
    { label: "Completed Today", value: completedToday.length, icon: CheckCircle2, color: "text-neon", bg: "bg-neon/10" },
    { label: "Focus Time Today", value: `${focusMinutesToday}m`, icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Blitz Sessions", value: sessionsToday, icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Total Completed", value: totalCompleted, icon: Trophy, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Active Tasks", value: activeCount, icon: Target, color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Inbox", value: inboxCount, icon: Inbox, color: "text-muted-foreground", bg: "bg-muted/50" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-neon/10">
          <BarChart3 size={20} className="text-neon" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Stats</h1>
          <p className="text-xs text-muted-foreground">Your productivity dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-lg bg-card border border-border/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-md", stat.bg)}>
                <stat.icon size={14} className={stat.color} />
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-card border border-border/50 mb-6">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-neon" />
          Last 7 Days
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {last7Days.map((day) => (
            <div key={day.label} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground">{day.count}</span>
              <div className="w-full relative" style={{ height: "80px" }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.count / maxDayCount) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={cn("absolute bottom-0 left-0 right-0 rounded-t-sm", isToday(day.date) ? "bg-neon" : "bg-neon/30")}
                />
              </div>
              <span className={cn("text-[10px]", isToday(day.date) ? "text-neon font-medium" : "text-muted-foreground")}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {avgAccuracy !== null && (
        <div className="p-4 rounded-lg bg-card border border-border/50 mb-6">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Target size={14} className="text-purple-400" />
            Estimate Accuracy
          </h3>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-purple-400">{avgAccuracy}%</div>
            <div className="text-xs text-muted-foreground">
              Based on {withBothTimes.length} completed tasks with estimates.
              {avgAccuracy < 80 && " You tend to underestimate."}
              {avgAccuracy > 120 && " You tend to overestimate."}
            </div>
          </div>
        </div>
      )}

      {tagMultipliers.length > 0 && (
        <div className="p-4 rounded-lg bg-card border border-border/50">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">Task DNA</h3>
          <p className="text-xs text-muted-foreground mb-3">How your actual time compares to estimates, by tag:</p>
          <div className="space-y-2">
            {tagMultipliers.map((tm) => (
              <div key={tm.tag} className="flex items-center gap-3">
                <span className="text-xs w-20 text-muted-foreground">#{tm.tag}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", tm.multiplier > 1.3 ? "bg-destructive" : tm.multiplier < 0.8 ? "bg-blue-400" : "bg-neon")}
                    style={{ width: `${Math.min(tm.multiplier * 50, 100)}%` }}
                  />
                </div>
                <span className={cn("text-xs font-mono w-12 text-right", tm.multiplier > 1.3 ? "text-destructive" : tm.multiplier < 0.8 ? "text-blue-400" : "text-neon")}>
                  {tm.multiplier}x
                </span>
                <span className="text-[10px] text-muted-foreground/50">({tm.samples})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Trophy(props: React.ComponentProps<typeof CheckCircle2>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

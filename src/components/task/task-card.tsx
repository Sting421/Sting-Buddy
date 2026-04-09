"use client";

import { memo } from "react";
import {
  Clock,
  Flag,
  Sun,
  GripVertical,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";
import { completeTask, addToToday, removeFromToday, updateTask } from "@/lib/tasks";
import type { Task } from "@/lib/db";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const priorityConfig: Record<string, { color: string; dotColor: string }> = {
  urgent: { color: "text-red-400", dotColor: "bg-red-400" },
  high: { color: "text-orange-400", dotColor: "bg-orange-400" },
  medium: { color: "text-yellow-400", dotColor: "bg-yellow-400" },
  low: { color: "text-blue-400", dotColor: "bg-blue-400" },
  none: { color: "text-muted-foreground", dotColor: "bg-muted-foreground/30" },
};

const energyEmoji: Record<string, string> = {
  deep: "🧠",
  medium: "⚡",
  shallow: "🍃",
};

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  showTodayButton?: boolean;
  draggable?: boolean;
  compact?: boolean;
}

export const TaskCard = memo(function TaskCard({
  task,
  showProject,
  showTodayButton = true,
  draggable,
  compact,
}: TaskCardProps) {
  const { setTaskDetailId } = useUIStore();
  const priority = priorityConfig[task.priority] ?? priorityConfig.none;
  const isDone = task.status === "done";
  const isOverdue = task.dueDate && isPast(task.dueDate) && !isDone;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      className={cn(
        "group flex items-start gap-2 px-3 py-2.5 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all cursor-pointer",
        isDone && "opacity-50",
        isOverdue && "border-destructive/30"
      )}
      onClick={() => setTaskDetailId(task.id)}
    >
      {/* Drag handle */}
      {draggable && (
        <div className="opacity-0 group-hover:opacity-100 mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-opacity">
          <GripVertical size={14} />
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isDone) {
            updateTask(task.id, { status: "todo", completedAt: undefined });
          } else {
            completeTask(task.id);
          }
        }}
        className={cn(
          "w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 transition-all",
          isDone
            ? "bg-neon border-neon"
            : `${priority.color} border-current hover:bg-current/20`
        )}
      >
        {isDone && <CheckCircle2 size={12} className="text-background m-auto" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm leading-tight flex-1",
              isDone && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
        </div>

        {/* Meta row */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {task.priority !== "none" && (
              <span className={cn("flex items-center gap-0.5 text-[11px]", priority.color)}>
                <Flag size={10} />
                {task.priority}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="flex items-center gap-0.5 text-[11px] text-neon/70">
                <Clock size={10} />
                {task.estimatedMinutes}m
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-[11px]",
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                )}
              >
                <Calendar size={10} />
                {isToday(task.dueDate)
                  ? "Today"
                  : isTomorrow(task.dueDate)
                    ? "Tomorrow"
                    : format(task.dueDate, "MMM d")}
              </span>
            )}
            {task.energyLevel && (
              <span className="text-[11px]">{energyEmoji[task.energyLevel]}</span>
            )}
            {task.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-1 py-0 h-4 bg-secondary/50"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      {showTodayButton && !isDone && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            task.isInToday ? removeFromToday(task.id) : addToToday(task.id);
          }}
          className={cn(
            "opacity-0 group-hover:opacity-100 p-1 rounded transition-all shrink-0",
            task.isInToday
              ? "text-neon bg-neon/10"
              : "text-muted-foreground/40 hover:text-neon hover:bg-neon/10"
          )}
          title={task.isInToday ? "Remove from Today" : "Add to Today"}
        >
          <Sun size={14} />
        </button>
      )}
    </motion.div>
  );
});

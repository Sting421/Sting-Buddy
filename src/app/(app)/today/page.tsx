"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Zap,
  Clock,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task/task-card";
import { useUIStore, useWorkspaceStore, useBlitzStore } from "@/lib/store";
import { useTodayTasks, useCompletedToday, useSettings } from "@/lib/hooks";
import { updateTask } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function SortableTaskCard({ task }: { task: import("@/lib/db").Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} draggable showTodayButton={false} />
    </div>
  );
}

export default function TodayPage() {
  const router = useRouter();
  const { setQuickAddOpen } = useUIStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const tasks = useTodayTasks(activeWorkspaceId);
  const completedToday = useCompletedToday(activeWorkspaceId);
  const settings = useSettings();
  const [showCompleted, setShowCompleted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
  const dailyCapacity = settings?.dailyCapacityMinutes ?? 480;
  const isOverCapacity = totalEstimated > dailyCapacity;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Update todayOrder for all affected tasks
    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    for (let i = 0; i < reordered.length; i++) {
      await updateTask(reordered[i].id, { todayOrder: i });
    }
  }

  function startBlitz() {
    if (tasks.length === 0) return;
    router.push("/blitz");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon/10">
            <Sun size={20} className="text-neon" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{format(new Date(), "EEEE, MMMM d")}</h1>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} queued
              {totalEstimated > 0 && (
                <span className="ml-1">
                  &middot; ~{Math.round(totalEstimated / 60)}h {totalEstimated % 60}m estimated
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setQuickAddOpen(true)}
            variant="outline"
            className="h-8 text-xs"
          >
            <Plus size={14} className="mr-1" />
            Add
          </Button>
          <Button
            onClick={startBlitz}
            disabled={tasks.length === 0}
            className="bg-neon text-background hover:bg-neon/90 h-8 text-xs font-medium neon-glow"
          >
            <Zap size={14} className="mr-1" />
            Start Blitz
          </Button>
        </div>
      </div>

      {/* Capacity warning */}
      {isOverCapacity && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-warning/10 border border-warning/20"
        >
          <AlertTriangle size={16} className="text-warning shrink-0" />
          <p className="text-xs text-warning">
            You have ~{Math.round(totalEstimated / 60)}h of tasks but only ~
            {Math.round(dailyCapacity / 60)}h capacity. Consider deferring some tasks.
          </p>
        </motion.div>
      )}

      {/* Task queue (sortable) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {tasks.map((task, i) => (
                <div key={task.id} className="relative">
                  {i === 0 && (
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neon neon-glow" />
                  )}
                  <SortableTaskCard task={task} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {/* Completed today section */}
      {completedToday.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <Trophy size={14} className="text-neon" />
            <span>
              {completedToday.length} completed today
            </span>
          </button>
          {showCompleted && (
            <div className="space-y-1 opacity-60">
              {completedToday.map((task) => (
                <TaskCard key={task.id} task={task} showTodayButton={false} compact />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && completedToday.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-neon/5 flex items-center justify-center mb-4">
            <Sun size={28} className="text-neon/40" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">No tasks for today</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs">
            Add tasks from your Inbox or create new ones to build your daily queue.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setQuickAddOpen(true)} variant="outline" className="text-xs h-8">
              <Plus size={14} className="mr-1" />
              New Task
            </Button>
            <Button onClick={() => router.push("/inbox")} variant="ghost" className="text-xs h-8">
              Go to Inbox
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

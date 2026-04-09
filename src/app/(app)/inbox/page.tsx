"use client";

import { useState } from "react";
import { Inbox as InboxIcon, Plus, Sparkles, ArrowRight, Trash2, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task/task-card";
import { useUIStore, useWorkspaceStore } from "@/lib/store";
import { useInboxTasks } from "@/lib/hooks";
import { updateTask, deleteTask, addToToday } from "@/lib/tasks";

export default function InboxPage() {
  const { setQuickAddOpen } = useUIStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const tasks = useInboxTasks(activeWorkspaceId);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function triageToTodo() {
    for (const id of selectedIds) {
      await updateTask(id, { status: "todo" });
    }
    setSelectedIds(new Set());
  }

  async function triageToToday() {
    for (const id of selectedIds) {
      await updateTask(id, { status: "todo" });
      await addToToday(id);
    }
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    for (const id of selectedIds) {
      await deleteTask(id);
    }
    setSelectedIds(new Set());
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon/10">
            <InboxIcon size={20} className="text-neon" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Inbox</h1>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} to triage
            </p>
          </div>
        </div>
        <Button
          onClick={() => setQuickAddOpen(true)}
          className="bg-neon text-background hover:bg-neon/90 h-8 text-xs font-medium"
        >
          <Plus size={14} className="mr-1" />
          New Task
        </Button>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-accent border border-border"
        >
          <span className="text-xs text-muted-foreground mr-2">
            {selectedIds.size} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={triageToTodo}
          >
            <ArrowRight size={12} className="mr-1" />
            Move to Todo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-neon hover:text-neon"
            onClick={triageToToday}
          >
            <Sun size={12} className="mr-1" />
            Add to Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={bulkDelete}
          >
            <Trash2 size={12} className="mr-1" />
            Delete
          </Button>
        </motion.div>
      )}

      {/* Task list */}
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-neon/5 flex items-center justify-center mb-4">
            <Sparkles size={28} className="text-neon/40" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">Inbox zero!</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs">
            All caught up. Press <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">N</kbd> to
            capture a new task.
          </p>
          <Button
            onClick={() => setQuickAddOpen(true)}
            variant="outline"
            className="text-xs h-8"
          >
            <Plus size={14} className="mr-1" />
            Add Task
          </Button>
        </motion.div>
      )}
    </div>
  );
}

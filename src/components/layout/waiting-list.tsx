"use client";

import { useState } from "react";
import {
  ClipboardList,
  Plus,
  Sun,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore, useWorkspaceStore } from "@/lib/store";
import type { Task } from "@/lib/db";
import { createTask, addToToday } from "@/lib/tasks";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function WaitingList() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { setTaskDetailId } = useUIStore();
  const [newTitle, setNewTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: allTasks = [] } = useSWR<Task[]>(
    activeWorkspaceId
      ? `/api/tasks?workspaceId=${activeWorkspaceId}&parentId=none`
      : null,
    fetcher
  );

  const waitingTasks = allTasks.filter(
    (t) =>
      !t.isInToday &&
      (t.status === "inbox" || t.status === "todo") &&
      !t.scheduledDate
  );

  async function handleAdd() {
    if (!newTitle.trim() || !activeWorkspaceId) return;
    await createTask({
      title: newTitle.trim(),
      workspaceId: activeWorkspaceId,
      status: "todo",
    });
    setNewTitle("");
    setShowAdd(false);
  }

  return (
    <div className="w-64 border-l border-border bg-card/30 flex flex-col shrink-0 hidden lg:flex">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-neon" />
          <span className="text-xs font-semibold">Waiting list</span>
          <Badge
            variant="outline"
            className="text-[10px] h-4 px-1.5 bg-neon/10 text-neon border-neon/20"
          >
            {waitingTasks.length}
          </Badge>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {showAdd && (
        <div className="px-2 py-2 border-b border-border">
          <Input
            autoFocus
            placeholder="Quick add task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setShowAdd(false);
            }}
            className="h-7 text-xs bg-secondary/50"
          />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence mode="popLayout">
            {waitingTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group flex items-start gap-1.5 p-2 rounded-md bg-card/50 border border-border/30 hover:border-border cursor-pointer transition-all"
                onClick={() => setTaskDetailId(task.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium leading-tight truncate">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {task.estimatedMinutes && (
                      <span className="flex items-center gap-0.5 text-[9px] text-neon/60">
                        <Clock size={8} />
                        {task.estimatedMinutes}m
                      </span>
                    )}
                    {task.tags.slice(0, 1).map((tag) => (
                      <span key={tag} className="text-[9px] text-muted-foreground/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToToday(task.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground/30 hover:text-neon hover:bg-neon/10 transition-all"
                  title="Add to Today"
                >
                  <Sun size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {waitingTasks.length === 0 && !showAdd && (
            <div className="text-center py-8">
              <ClipboardList size={20} className="text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground/40">No unscheduled tasks</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

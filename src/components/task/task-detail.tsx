"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Flag,
  Hash,
  FolderOpen,
  Trash2,
  Sun,
  AtSign,
  Zap,
  CheckCircle2,
  CloudUpload,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useUIStore, useWorkspaceStore } from "@/lib/store";
import { useTask, useSubtasks, useAllProjects } from "@/lib/hooks";
import { updateTask, deleteTask, completeTask, addToToday, removeFromToday, createTask } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { Priority, EnergyLevel, TaskStatus } from "@/lib/db";
import { useCalendarSync } from "@/lib/calendar-sync";
import { format } from "date-fns";

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: "none", label: "No priority", color: "text-muted-foreground" },
  { value: "low", label: "Low", color: "text-blue-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "urgent", label: "Urgent", color: "text-red-400" },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const energyOptions: { value: EnergyLevel; label: string; emoji: string }[] = [
  { value: "deep", label: "Deep Focus", emoji: "🧠" },
  { value: "medium", label: "Medium", emoji: "⚡" },
  { value: "shallow", label: "Shallow", emoji: "🍃" },
];

export function TaskDetail({ taskId }: { taskId: string }) {
  const { setTaskDetailId } = useUIStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const task = useTask(taskId);
  const subtasks = useSubtasks(taskId);
  const projects = useAllProjects(activeWorkspaceId);
  const { isConnected, syncTaskToCalendar } = useCalendarSync();
  const [newSubtask, setNewSubtask] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (task) setTitle(task.title);
  }, [task]);

  if (!task) return null;

  async function handleTitleSave() {
    if (title.trim() && title !== task!.title) {
      await updateTask(task!.id, { title: title.trim() });
    }
    setEditingTitle(false);
  }

  async function handleAddSubtask() {
    if (!newSubtask.trim() || !activeWorkspaceId) return;
    await createTask({
      title: newSubtask.trim(),
      workspaceId: activeWorkspaceId,
      parentId: task!.id,
      projectId: task!.projectId,
      status: "todo",
    });
    setNewSubtask("");
  }

  return (
    <Sheet open onOpenChange={() => setTaskDetailId(null)}>
      <SheetContent className="w-96 p-0 border-border bg-card flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-medium text-foreground">Task Details</SheetTitle>
            <div className="flex items-center gap-1">
              {task.status !== "done" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    completeTask(task.id);
                    setTaskDetailId(null);
                  }}
                  className="text-neon hover:text-neon hover:bg-neon/10 h-7 text-xs"
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  Done
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  await deleteTask(task.id);
                  setTaskDetailId(null);
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
          {/* Title */}
          {editingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              className="w-full bg-transparent text-lg font-semibold outline-none border-b border-neon/30 pb-1"
              autoFocus
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className={cn(
                "text-lg font-semibold cursor-pointer hover:text-neon transition-colors",
                task.status === "done" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h2>
          )}

          {/* Description */}
          <Textarea
            placeholder="Add a description..."
            value={task.description ?? ""}
            onChange={(e) => updateTask(task.id, { description: e.target.value })}
            className="bg-secondary/50 border-border text-sm min-h-[80px] resize-none"
          />

          <Separator />

          {/* Properties */}
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">Status</span>
              <Select
                value={task.status}
                onValueChange={(v) => updateTask(task.id, { status: v as TaskStatus })}
              >
                <SelectTrigger className="h-7 text-xs w-36 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">Priority</span>
              <Select
                value={task.priority}
                onValueChange={(v) => updateTask(task.id, { priority: v as Priority })}
              >
                <SelectTrigger className="h-7 text-xs w-36 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      <span className={o.color}>{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">Project</span>
              <Select
                value={task.projectId ?? "none"}
                onValueChange={(v) =>
                  updateTask(task.id, { projectId: !v || v === "none" ? undefined : v })
                }
              >
                <SelectTrigger className="h-7 text-xs w-36 bg-secondary/50">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.emoji} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Energy */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">Energy</span>
              <Select
                value={task.energyLevel ?? "none"}
                onValueChange={(v) =>
                  updateTask(task.id, {
                    energyLevel: v === "none" ? undefined : (v as EnergyLevel),
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs w-36 bg-secondary/50">
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">Not set</SelectItem>
                  {energyOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.emoji} {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time estimate */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">Estimate</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={task.estimatedMinutes ?? ""}
                  onChange={(e) =>
                    updateTask(task.id, {
                      estimatedMinutes: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="h-7 w-20 text-xs bg-secondary/50"
                  placeholder="min"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>

            {/* Due date */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">Due</span>
              <Input
                type="date"
                value={task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  updateTask(task.id, {
                    dueDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="h-7 w-36 text-xs bg-secondary/50"
              />
            </div>

            {/* Scheduled date */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">Scheduled</span>
              <Input
                type="date"
                value={task.scheduledDate ? format(task.scheduledDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  updateTask(task.id, {
                    scheduledDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="h-7 w-36 text-xs bg-secondary/50"
              />
            </div>

            {/* Today toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground w-24">Today</span>
              <Button
                variant={task.isInToday ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 text-xs",
                  task.isInToday && "bg-neon text-background hover:bg-neon/90"
                )}
                onClick={() => (task.isInToday ? removeFromToday(task.id) : addToToday(task.id))}
              >
                <Sun size={12} className="mr-1" />
                {task.isInToday ? "In Today" : "Add to Today"}
              </Button>
            </div>

            {/* Google Calendar sync */}
            {isConnected && task.scheduledDate && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground w-24">Calendar</span>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 text-xs",
                    task.calendarEventId && "text-neon border-neon/30"
                  )}
                  disabled={syncing}
                  onClick={async () => {
                    setSyncing(true);
                    await syncTaskToCalendar(task);
                    setSyncing(false);
                  }}
                >
                  <CloudUpload size={12} className="mr-1" />
                  {syncing ? "Syncing..." : task.calendarEventId ? "Synced" : "Sync to Google"}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <span className="text-xs text-muted-foreground">Tags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              <Input
                placeholder="+ Add tag"
                className="h-6 w-24 text-xs bg-transparent border-dashed"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim().replace("#", "");
                    if (val && !task.tags.includes(val)) {
                      updateTask(task.id, { tags: [...task.tags, val] });
                    }
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Subtasks */}
          <div>
            <span className="text-xs text-muted-foreground">Subtasks</span>
            <div className="space-y-1 mt-2">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() =>
                      updateTask(sub.id, {
                        status: sub.status === "done" ? "todo" : "done",
                        completedAt: sub.status === "done" ? undefined : new Date(),
                      })
                    }
                    className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors",
                      sub.status === "done"
                        ? "bg-neon border-neon"
                        : "border-muted-foreground/30 hover:border-neon/50"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm flex-1",
                      sub.status === "done" && "line-through text-muted-foreground"
                    )}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteTask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 text-destructive/50 hover:text-destructive transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-muted-foreground/20 shrink-0" />
                <Input
                  placeholder="Add subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  className="h-7 text-xs bg-transparent border-none shadow-none px-0"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

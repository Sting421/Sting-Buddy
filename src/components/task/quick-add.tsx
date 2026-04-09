"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Calendar,
  Clock,
  Flag,
  Hash,
  Sun,
  FolderOpen,
  Zap,
  X,
  Plus,
} from "lucide-react";
import { useUIStore, useWorkspaceStore } from "@/lib/store";
import { useAllProjects } from "@/lib/hooks";
import { useCalendarSync } from "@/lib/calendar-sync";
import { createTask } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Priority, EnergyLevel, TaskStatus } from "@/lib/db";

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
];

const energyOptions: { value: EnergyLevel; label: string; emoji: string }[] = [
  { value: "deep", label: "Deep Focus", emoji: "🧠" },
  { value: "medium", label: "Medium", emoji: "⚡" },
  { value: "shallow", label: "Shallow", emoji: "🍃" },
];

export function QuickAdd() {
  const { quickAddOpen, setQuickAddOpen } = useUIStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const projects = useAllProjects(activeWorkspaceId);
  const { isConnected, syncTaskToCalendar } = useCalendarSync();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("inbox");
  const [priority, setPriority] = useState<Priority>("none");
  const [projectId, setProjectId] = useState<string>("none");
  const [energyLevel, setEnergyLevel] = useState<string>("none");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isInToday, setIsInToday] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");

  useEffect(() => {
    if (quickAddOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [quickAddOpen]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus("inbox");
    setPriority("none");
    setProjectId("none");
    setEnergyLevel("none");
    setEstimatedMinutes("");
    setDueDate("");
    setScheduledDate("");
    setIsInToday(false);
    setTags([]);
    setTagInput("");
    setSubtasks([]);
    setSubtaskInput("");
  }

  async function handleSubmit() {
    if (!title.trim() || !activeWorkspaceId) return;

    const task = await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      workspaceId: activeWorkspaceId,
      status,
      priority,
      projectId: projectId === "none" ? undefined : projectId,
      energyLevel: energyLevel === "none" ? undefined : (energyLevel as EnergyLevel),
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      isInToday,
      tags,
    });

    // Create subtasks
    for (const sub of subtasks) {
      if (sub.trim()) {
        await createTask({
          title: sub.trim(),
          workspaceId: activeWorkspaceId,
          parentId: task.id,
          projectId: projectId === "none" ? undefined : projectId,
          status: "todo",
        });
      }
    }

    // Auto-sync to Google Calendar if signed in and task has a scheduled date
    if (isConnected && scheduledDate) {
      try {
        await syncTaskToCalendar(task);
      } catch (e) {
        console.error("Calendar sync failed:", e);
      }
    }

    resetForm();
    setQuickAddOpen(false);
  }

  return (
    <Dialog
      open={quickAddOpen}
      onOpenChange={(open) => {
        setQuickAddOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="p-0 gap-0 max-w-lg border-border bg-popover overflow-hidden max-h-[85vh] flex flex-col">
        {/* Title input */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-neon/40 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Task name..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && title.trim()) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
          <Textarea
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 bg-secondary/30 border-border/50 text-xs min-h-[50px] resize-none ml-7"
          />
        </div>

        <Separator />

        {/* Properties */}
        <div className="flex-1 overflow-auto px-4 py-3 space-y-2.5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground w-24">Status</span>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground w-24">Priority</span>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50">
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
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "none")}>
              <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50">
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
            <Select value={energyLevel} onValueChange={(v) => setEnergyLevel(v ?? "none")}>
              <SelectTrigger className="h-7 text-xs w-40 bg-secondary/50">
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

          {/* Estimate */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground w-24">Estimate</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
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
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-7 w-40 text-xs bg-secondary/50"
            />
          </div>

          {/* Scheduled date */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground w-24">Scheduled</span>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="h-7 w-40 text-xs bg-secondary/50"
            />
          </div>

          {/* Today toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground w-24">Today</span>
            <Button
              type="button"
              variant={isInToday ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-xs",
                isInToday && "bg-neon text-background hover:bg-neon/90"
              )}
              onClick={() => setIsInToday(!isInToday)}
            >
              <Sun size={12} className="mr-1" />
              {isInToday ? "In Today" : "Add to Today"}
            </Button>
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <span className="text-xs text-muted-foreground">Tags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs gap-1">
                  #{tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X size={10} />
                  </button>
                </Badge>
              ))}
              <Input
                placeholder="+ Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="h-6 w-24 text-xs bg-transparent border-dashed"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = tagInput.trim().replace("#", "");
                    if (val && !tags.includes(val)) {
                      setTags([...tags, val]);
                    }
                    setTagInput("");
                  }
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Subtasks */}
          <div>
            <span className="text-xs text-muted-foreground">Subtasks</span>
            <div className="space-y-1 mt-1">
              {subtasks.map((sub, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  <span className="text-xs flex-1">{sub}</span>
                  <button
                    onClick={() => setSubtasks(subtasks.filter((_, j) => j !== i))}
                    className="text-destructive/50 hover:text-destructive"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-dashed border-muted-foreground/20 shrink-0" />
                <Input
                  placeholder="Add subtask..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  className="h-6 text-xs bg-transparent border-none shadow-none px-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && subtaskInput.trim()) {
                      setSubtasks([...subtasks, subtaskInput.trim()]);
                      setSubtaskInput("");
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/20">
          <p className="text-[10px] text-muted-foreground">
            {isConnected && scheduledDate ? "Will sync to Google Calendar" : "Press Enter to save"}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            size="sm"
            className="bg-neon text-background hover:bg-neon/90 h-7 text-xs px-4"
          >
            <Plus size={12} className="mr-1" />
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

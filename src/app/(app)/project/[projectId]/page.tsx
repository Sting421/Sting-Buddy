"use client";

import { useState } from "react";
import { use } from "react";
import {
  FolderOpen,
  Plus,
  List,
  LayoutGrid,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskCard } from "@/components/task/task-card";
import { useWorkspaceStore } from "@/lib/store";
import { useProjectTasks } from "@/lib/hooks";
import { createTask } from "@/lib/tasks";
import type { Project, TaskStatus } from "@/lib/db";
import { cn } from "@/lib/utils";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ViewMode = "list" | "board";

const boardColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "To Do", color: "border-blue-500/30" },
  { status: "in_progress", label: "In Progress", color: "border-yellow-500/30" },
  { status: "done", label: "Done", color: "border-neon/30" },
];

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: project } = useSWR<Project>(
    `/api/projects/${projectId}`,
    fetcher,
    { fallbackData: undefined }
  );

  const tasks = useProjectTasks(projectId);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  }

  async function handleNameSave() {
    if (name.trim() && name !== project!.name) {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
    }
    setEditingName(false);
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim() || !activeWorkspaceId) return;
    await createTask({
      title: newTaskTitle.trim(),
      workspaceId: activeWorkspaceId,
      projectId,
      status: "todo",
    });
    setNewTaskTitle("");
  }

  async function handleDeleteProject() {
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    window.history.back();
  }

  const activeTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon/10">
            <FolderOpen size={20} className="text-neon" />
          </div>
          <div>
            {editingName ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                className="bg-transparent text-lg font-semibold outline-none border-b border-neon/30"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg font-semibold cursor-pointer hover:text-neon transition-colors"
                onClick={() => { setName(project.name); setEditingName(true); }}
              >
                {project.emoji} {project.name}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {activeTasks.length} active &middot; {doneTasks.length} done
              </span>
              {progress > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-neon rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-neon">{progress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8 bg-secondary">
              <TabsTrigger value="list" className="h-6 text-xs px-2"><List size={14} /></TabsTrigger>
              <TabsTrigger value="board" className="h-6 text-xs px-2"><LayoutGrid size={14} /></TabsTrigger>
            </TabsList>
          </Tabs>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={handleDeleteProject}>
                <Trash2 size={14} className="mr-2" />Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20 shrink-0" />
        <Input
          placeholder="Add a task to this project..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          className="bg-card/50 border-border/50 text-sm h-9"
        />
        <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()} size="sm" className="bg-neon text-background hover:bg-neon/90 h-9">
          <Plus size={14} />
        </Button>
      </div>

      {viewMode === "list" && (
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (<TaskCard key={task.id} task={task} />))}
          </AnimatePresence>
        </div>
      )}

      {viewMode === "board" && (
        <div className="grid grid-cols-3 gap-3">
          {boardColumns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className={cn("rounded-lg border-t-2 bg-card/30 p-2", col.color)}>
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">{col.label}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{columnTasks.length}</Badge>
                </div>
                <div className="space-y-1.5">
                  {columnTasks.map((task) => (<TaskCard key={task.id} task={task} compact showTodayButton={false} />))}
                  {columnTasks.length === 0 && (<div className="text-xs text-muted-foreground/40 text-center py-4">No tasks</div>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tasks.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={32} className="text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-medium mb-1">No tasks yet</h3>
          <p className="text-xs text-muted-foreground">Add your first task to get started.</p>
        </motion.div>
      )}
    </div>
  );
}

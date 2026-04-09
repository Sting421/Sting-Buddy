"use client";

import { useState } from "react";
import {
  Columns3,
  Plus,
  GripVertical,
  Clock,
  Flag,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUIStore, useWorkspaceStore } from "@/lib/store";
import { useBoardTasks, useAllProjects } from "@/lib/hooks";
import type { Task, TaskStatus } from "@/lib/db";
import { updateTask, createTask } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast } from "date-fns";

interface BoardColumn {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
  dotColor: string;
}

const columns: BoardColumn[] = [
  {
    id: "inbox",
    title: "Inbox",
    color: "border-t-slate-400",
    bgColor: "bg-slate-500/5",
    dotColor: "bg-slate-400",
  },
  {
    id: "todo",
    title: "To Do",
    color: "border-t-blue-500",
    bgColor: "bg-blue-500/5",
    dotColor: "bg-blue-400",
  },
  {
    id: "in_progress",
    title: "In Progress",
    color: "border-t-amber-500",
    bgColor: "bg-amber-500/5",
    dotColor: "bg-amber-400",
  },
  {
    id: "done",
    title: "Done",
    color: "border-t-emerald-500",
    bgColor: "bg-emerald-500/5",
    dotColor: "bg-emerald-400",
  },
];

function DroppableColumn({
  column,
  children,
  count,
  onAdd,
}: {
  column: BoardColumn;
  children: React.ReactNode;
  count: number;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-xl border-t-2 transition-colors",
        column.color,
        column.bgColor,
        isOver && "ring-2 ring-neon/30 bg-neon/5"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", column.dotColor)} />
          <span className="text-xs font-semibold">{column.title}</span>
          <Badge
            variant="outline"
            className="text-[10px] h-4 px-1.5 bg-secondary/50"
          >
            {count}
          </Badge>
        </div>
        <button
          onClick={onAdd}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function SortableCard({
  task,
  projectName,
}: {
  task: Task;
  projectName: string | null;
}) {
  const { setTaskDetailId } = useUIStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        className={cn(
          "group bg-card border border-border/50 rounded-lg p-3 cursor-pointer hover:border-neon/20 transition-all",
          isOverdue && "border-destructive/30"
        )}
        onClick={() => setTaskDetailId(task.id)}
      >
        <div className="flex items-start gap-1.5">
          <div
            {...listeners}
            className="opacity-0 group-hover:opacity-100 mt-0.5 cursor-grab text-muted-foreground/30 hover:text-muted-foreground transition-opacity"
          >
            <GripVertical size={12} />
          </div>
          <span
            className={cn(
              "text-sm font-medium leading-tight flex-1",
              task.status === "done" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-5">
          {task.estimatedMinutes && (
            <span className="flex items-center gap-0.5 text-[10px] text-neon/70">
              <Clock size={9} />
              {task.estimatedMinutes}m
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px]",
                isOverdue
                  ? "text-destructive"
                  : isToday(new Date(task.dueDate))
                    ? "text-neon"
                    : "text-muted-foreground"
              )}
            >
              <Calendar size={9} />
              {isToday(new Date(task.dueDate))
                ? "Today"
                : isTomorrow(new Date(task.dueDate))
                  ? "Tomorrow"
                  : format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {task.priority !== "none" && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px]",
                task.priority === "urgent"
                  ? "text-red-400"
                  : task.priority === "high"
                    ? "text-orange-400"
                    : task.priority === "medium"
                      ? "text-yellow-400"
                      : "text-blue-400"
              )}
            >
              <Flag size={9} />
              {task.priority}
            </span>
          )}
          {projectName && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              {projectName}
            </span>
          )}
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1 py-0 rounded bg-secondary/50 text-muted-foreground/70"
            >
              #{tag}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function BoardPage() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const projects = useAllProjects(activeWorkspaceId);
  const tasks = useBoardTasks(activeWorkspaceId);
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function getProjectName(id?: string | null) {
    if (!id) return null;
    return projects.find((p) => p.id === id)?.name ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Dropped on a column droppable
    const targetColumn = columns.find((c) => c.id === overId);
    if (targetColumn) {
      const draggedTask = tasks.find((t) => t.id === taskId);
      if (draggedTask && draggedTask.status !== targetColumn.id) {
        await updateTask(taskId, { status: targetColumn.id });
      }
      return;
    }

    // Dropped on another task — adopt that task's status
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && overTask.id !== taskId) {
      const draggedTask = tasks.find((t) => t.id === taskId);
      if (draggedTask && draggedTask.status !== overTask.status) {
        await updateTask(taskId, { status: overTask.status });
      }
    }
  }

  async function handleAddTask(status: TaskStatus) {
    if (!newTitle.trim() || !activeWorkspaceId) return;
    await createTask({
      title: newTitle.trim(),
      workspaceId: activeWorkspaceId,
      status,
    });
    setNewTitle("");
    setAddingTo(null);
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/30">
        <div className="flex items-center gap-2">
          <Columns3 size={18} className="text-neon" />
          <span className="text-base font-semibold">Board</span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-h-full">
            {columns.map((col) => {
              const colTasks = tasks
                .filter((t) => t.status === col.id)
                .sort((a, b) => a.order - b.order);

              return (
                <DroppableColumn
                  key={col.id}
                  column={col}
                  count={colTasks.length}
                  onAdd={() => {
                    setAddingTo(col.id);
                    setNewTitle("");
                  }}
                >
                  {/* Inline add */}
                  {addingTo === col.id && (
                    <div className="px-2 pb-2">
                      <Input
                        autoFocus
                        placeholder="Task name..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTask(col.id);
                          if (e.key === "Escape") setAddingTo(null);
                        }}
                        onBlur={() => {
                          if (newTitle.trim()) handleAddTask(col.id);
                          else setAddingTo(null);
                        }}
                        className="h-8 text-xs bg-card border-neon/20"
                      />
                    </div>
                  )}

                  <SortableContext
                    items={colTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                    id={col.id}
                  >
                    <div className="flex-1 overflow-auto px-2 pb-2 space-y-1.5 min-h-[60px]">
                      {colTasks.map((task) => (
                        <SortableCard
                          key={task.id}
                          task={task}
                          projectName={getProjectName(task.projectId)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeTask && (
              <div className="bg-card border border-neon/30 rounded-lg p-3 shadow-xl shadow-neon/10 w-72 opacity-90">
                <span className="text-sm font-medium">{activeTask.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

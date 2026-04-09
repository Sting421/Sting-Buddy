"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Pause,
  Play,
  SkipForward,
  Check,
  X,
  Clock,
  Plus,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBlitzStore, useWorkspaceStore } from "@/lib/store";
import { useTodayTasks, useTask } from "@/lib/hooks";
import { completeTask, updateTask } from "@/lib/tasks";
import { cn } from "@/lib/utils";

const soundscapes = [
  { id: "none", label: "Silence", emoji: "🔇" },
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "cafe", label: "Cafe", emoji: "☕" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "brown", label: "Brown Noise", emoji: "🟤" },
  { id: "white", label: "White Noise", emoji: "⚪" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function BlitzPage() {
  const router = useRouter();
  const { activeWorkspaceId } = useWorkspaceStore();
  const todayTasks = useTodayTasks(activeWorkspaceId);
  const {
    isActive,
    currentTaskId,
    queue,
    timeRemaining,
    isPaused,
    soundscape,
    streak,
    startBlitz,
    pauseBlitz,
    resumeBlitz,
    skipTask,
    completeTask: blitzComplete,
    stopBlitz,
    tick,
    setSoundscape,
    extendTime,
  } = useBlitzStore();

  const currentTask = useTask(currentTaskId);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [showCompleteAnim, setShowCompleteAnim] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Timer tick
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => tick(), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, tick]);

  // Track start time for actual time calculation
  useEffect(() => {
    if (isActive && currentTaskId) {
      startTimeRef.current = Date.now();
    }
  }, [isActive, currentTaskId]);

  function handleStart() {
    if (todayTasks.length === 0) return;
    const ids = todayTasks.map((t) => t.id);
    const firstTask = todayTasks[0];
    const estimate = (firstTask.estimatedMinutes ?? 25) * 60;
    startBlitz(ids[0], ids, estimate);
  }

  async function handleComplete() {
    if (!currentTaskId) return;

    // Calculate actual time
    const actualSeconds = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;
    const actualMinutes = Math.round(actualSeconds / 60);

    await completeTask(currentTaskId);
    if (actualMinutes > 0) {
      await updateTask(currentTaskId, { actualMinutes });
    }

    // Record time entry via API
    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: currentTaskId,
        startedAt: new Date(startTimeRef.current ?? Date.now()),
        endedAt: new Date(),
        durationMinutes: actualMinutes,
      }),
    });

    setShowCompleteAnim(true);
    setTimeout(() => {
      setShowCompleteAnim(false);
      blitzComplete();
      startTimeRef.current = Date.now();
    }, 800);
  }

  function handleSkip() {
    startTimeRef.current = Date.now();
    skipTask();
  }

  // Calculate progress
  const totalSeconds = currentTask?.estimatedMinutes
    ? currentTask.estimatedMinutes * 60
    : 25 * 60;
  const elapsed = totalSeconds - timeRemaining;
  const progressPercent = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;
  const isOvertime = timeRemaining <= 0 && isActive;

  const nextTaskIndex = queue.indexOf(currentTaskId ?? "") + 1;
  const nextTaskId = queue[nextTaskIndex];
  const nextTask = useTask(nextTaskId ?? null);

  // ─── Not started state ──────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-neon/10 flex items-center justify-center mb-6 neon-glow">
            <Zap size={40} className="text-neon" />
          </div>
          <h1 className="text-2xl font-bold mb-2 neon-text text-neon">Blitz Mode</h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm">
            Focus on one task at a time. Race through your queue with a countdown timer.
            No distractions, just execution.
          </p>

          {todayTasks.length > 0 ? (
            <>
              <div className="w-full space-y-2 mb-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{todayTasks.length} tasks in queue</span>
                  <span>
                    ~{Math.round(todayTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 25), 0) / 60)}h{" "}
                    {todayTasks.reduce((s, t) => s + (t.estimatedMinutes ?? 25), 0) % 60}m
                  </span>
                </div>
                <div className="space-y-1">
                  {todayTasks.slice(0, 5).map((task, i) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        i === 0
                          ? "bg-neon/10 border border-neon/20 text-neon"
                          : "bg-card/50 text-muted-foreground"
                      )}
                    >
                      {i === 0 && <ChevronRight size={14} className="text-neon" />}
                      <span className="flex-1 truncate">{task.title}</span>
                      {task.estimatedMinutes && (
                        <span className="text-xs opacity-60">{task.estimatedMinutes}m</span>
                      )}
                    </div>
                  ))}
                  {todayTasks.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{todayTasks.length - 5} more
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={handleStart}
                size="lg"
                className="bg-neon text-background hover:bg-neon/90 font-bold text-base px-8 neon-glow"
              >
                <Zap size={18} className="mr-2" />
                Start Blitz
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No tasks in your Today queue. Add some tasks first!
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push("/today")} variant="outline">
                  Go to Today
                </Button>
                <Button onClick={() => router.push("/inbox")} variant="ghost">
                  Go to Inbox
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Active blitz state ─────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] px-4 relative overflow-hidden">
      {/* Background pulse */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          isOvertime ? "bg-destructive/5" : "bg-neon/[0.02]"
        )}
      />

      {/* Complete animation overlay */}
      <AnimatePresence>
        {showCompleteAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/80"
          >
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-neon flex items-center justify-center mb-3"
              >
                <Check size={36} className="text-background" />
              </motion.div>
              <span className="text-lg font-bold text-neon neon-text">Done!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Queue progress */}
        <div className="flex items-center gap-1 mb-6">
          {queue.map((id, i) => {
            const isCurrent = id === currentTaskId;
            const isDone = i < queue.indexOf(currentTaskId ?? "");
            return (
              <div
                key={id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  isCurrent ? "w-8 bg-neon" : isDone ? "w-4 bg-neon/40" : "w-4 bg-muted"
                )}
              />
            );
          })}
        </div>

        {/* Timer */}
        <motion.div
          key={currentTaskId}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-8"
        >
          <div
            className={cn(
              "text-7xl font-mono font-bold tracking-tight mb-2",
              isOvertime ? "text-destructive" : "text-neon neon-text"
            )}
          >
            {isOvertime ? "+" : ""}
            {formatTime(Math.abs(timeRemaining))}
          </div>
          <Progress
            value={Math.min(progressPercent, 100)}
            className={cn(
              "h-1 w-48",
              isOvertime && "[&>div]:bg-destructive"
            )}
          />
        </motion.div>

        {/* Current task */}
        <motion.div
          key={currentTaskId}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl font-semibold mb-1">{currentTask?.title}</h2>
          {currentTask?.description && (
            <p className="text-sm text-muted-foreground max-w-sm">{currentTask.description}</p>
          )}
          <div className="flex items-center justify-center gap-3 mt-3">
            {currentTask?.estimatedMinutes && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} /> {currentTask.estimatedMinutes}m estimate
              </span>
            )}
            {currentTask?.priority && currentTask.priority !== "none" && (
              <span
                className={cn(
                  "text-xs capitalize",
                  currentTask.priority === "urgent"
                    ? "text-red-400"
                    : currentTask.priority === "high"
                      ? "text-orange-400"
                      : "text-muted-foreground"
                )}
              >
                {currentTask.priority}
              </span>
            )}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-border"
            onClick={handleSkip}
            title="Skip"
          >
            <SkipForward size={18} />
          </Button>

          <Button
            size="icon"
            className={cn(
              "h-16 w-16 rounded-full text-background font-bold",
              isPaused
                ? "bg-neon hover:bg-neon/90 neon-glow"
                : "bg-warning hover:bg-warning/90"
            )}
            onClick={isPaused ? resumeBlitz : pauseBlitz}
          >
            {isPaused ? <Play size={24} /> : <Pause size={24} />}
          </Button>

          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-neon text-background hover:bg-neon/90"
            onClick={handleComplete}
            title="Mark Done"
          >
            <Check size={18} />
          </Button>
        </div>

        {/* Extra controls */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => extendTime(5 * 60)}
          >
            <Plus size={12} className="mr-1" />5 min
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => extendTime(10 * 60)}
          >
            <Plus size={12} className="mr-1" />
            10 min
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:text-destructive"
            onClick={stopBlitz}
          >
            <X size={12} className="mr-1" />
            End Blitz
          </Button>
        </div>

        {/* Soundscape selector */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <div className="flex gap-1">
            {soundscapes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSoundscape(s.id)}
                className={cn(
                  "px-2 py-1 rounded text-xs transition-colors",
                  soundscape === s.id
                    ? "bg-neon/10 text-neon"
                    : "text-muted-foreground hover:bg-accent"
                )}
                title={s.label}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Next up */}
        {nextTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-muted-foreground/60"
          >
            <span>Next:</span>
            <span className="truncate max-w-48">{nextTask.title}</span>
            {nextTask.estimatedMinutes && <span>({nextTask.estimatedMinutes}m)</span>}
          </motion.div>
        )}

        {/* Streak */}
        {streak > 0 && (
          <div className="mt-4 text-xs text-neon/60">
            🔥 {streak} task streak
          </div>
        )}
      </div>
    </div>
  );
}

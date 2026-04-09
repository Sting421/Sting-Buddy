"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { QuickAdd } from "@/components/task/quick-add";
import { CommandPalette } from "@/components/layout/command-palette";
import { TaskDetail } from "@/components/task/task-detail";
import { WaitingList } from "@/components/layout/waiting-list";
import { useUIStore } from "@/lib/store";
import { useKeyboardShortcuts, useOnlineStatus } from "@/lib/hooks";
import { useWorkspaceStore } from "@/lib/store";
import { api } from "@/lib/db";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { taskDetailId } = useUIStore();
  const { setActiveWorkspace } = useWorkspaceStore();
  const [ready, setReady] = useState(false);

  useKeyboardShortcuts();
  useOnlineStatus();

  useEffect(() => {
    api.seed().then(({ workspaces }) => {
      if (workspaces.length > 0) {
        setActiveWorkspace(workspaces[0].id);
      }
      setReady(true);
    });
  }, [setActiveWorkspace]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl">🐝</div>
          <div className="text-neon font-bold text-xl neon-text">StingBuddy</div>
          <div className="w-8 h-8 border-2 border-neon border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto">{children}</main>
            <WaitingList />
          </div>
        </div>
        {taskDetailId && <TaskDetail taskId={taskDetailId} />}
        <QuickAdd />
        <CommandPalette />
      </div>
    </SessionProvider>
  );
}

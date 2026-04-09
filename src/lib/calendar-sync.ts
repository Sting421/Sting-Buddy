"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  taskToCalendarEvent,
} from "./google-calendar";
import { type Task } from "./db";
import { updateTask } from "./tasks";

export function useCalendarSync() {
  const { data: session } = useSession();
  const accessToken = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;

  const syncTaskToCalendar = useCallback(
    async (task: Task) => {
      if (!accessToken) return;

      const event = taskToCalendarEvent({
        title: task.title,
        description: task.description ?? undefined,
        scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
        estimatedMinutes: task.estimatedMinutes ?? undefined,
      });
      if (!event) return;

      if (task.calendarEventId) {
        await updateCalendarEvent(accessToken, task.calendarEventId, event);
      } else {
        const eventId = await createCalendarEvent(accessToken, event);
        if (eventId) {
          await updateTask(task.id, { calendarEventId: eventId });
        }
      }
    },
    [accessToken]
  );

  const removeFromCalendar = useCallback(
    async (task: Task) => {
      if (!accessToken || !task.calendarEventId) return;
      await deleteCalendarEvent(accessToken, task.calendarEventId);
      await updateTask(task.id, { calendarEventId: undefined });
    },
    [accessToken]
  );

  return {
    isConnected: !!accessToken,
    accessToken,
    syncTaskToCalendar,
    removeFromCalendar,
  };
}

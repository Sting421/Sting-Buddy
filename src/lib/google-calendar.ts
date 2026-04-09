// Google Calendar sync — creates/updates/deletes calendar events for tasks
// This runs client-side using the access token from the session

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  colorId?: string;
}

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export async function listCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    console.error("Failed to list calendar events:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.items ?? [];
}

export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<string | null> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    console.error("Failed to create calendar event:", await res.text());
    return null;
  }

  const data = await res.json();
  return data.id;
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<boolean> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  return res.ok;
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return res.ok || res.status === 404;
}

// Convert a StingBuddy task to a Google Calendar event
export function taskToCalendarEvent(task: {
  title: string;
  description?: string;
  scheduledDate?: Date;
  estimatedMinutes?: number;
}): CalendarEvent | null {
  if (!task.scheduledDate) return null;

  const start = new Date(task.scheduledDate);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + (task.estimatedMinutes ?? 30));

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    summary: `[StingBuddy] ${task.title}`,
    description: task.description ?? "",
    start: { dateTime: start.toISOString(), timeZone },
    end: { dateTime: end.toISOString(), timeZone },
    colorId: "2", // sage/green
  };
}

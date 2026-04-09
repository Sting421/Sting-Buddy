import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await prisma.timeEntry.create({
    data: {
      taskId: body.taskId,
      startedAt: new Date(body.startedAt),
      endedAt: body.endedAt ? new Date(body.endedAt) : null,
      durationMinutes: body.durationMinutes ?? null,
    },
  });
  return NextResponse.json(entry);
}

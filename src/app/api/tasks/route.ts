import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const workspaceId = sp.get("workspaceId");
  const projectId = sp.get("projectId");
  const parentId = sp.get("parentId");
  const status = sp.get("status");
  const isInToday = sp.get("isInToday");
  const completedToday = sp.get("completedToday");
  const search = sp.get("search");

  const where: Record<string, unknown> = {};
  if (workspaceId) where.workspaceId = workspaceId;
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;

  // parentId filter: "none" means top-level tasks, otherwise filter by parentId
  if (parentId === "none") {
    where.parentId = null;
  } else if (parentId) {
    where.parentId = parentId;
  }

  if (isInToday === "true") {
    where.isInToday = true;
    where.status = { notIn: ["done", "cancelled"] };
  }

  if (completedToday === "true") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.status = "done";
    where.completedAt = { gte: start, lte: end };
  }

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: sp.get("limit") ? parseInt(sp.get("limit")!) : undefined,
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Get next order value
  const maxOrder = await prisma.task.count({
    where: { workspaceId: body.workspaceId },
  });

  const task = await prisma.task.create({
    data: {
      workspaceId: body.workspaceId,
      projectId: body.projectId || null,
      parentId: body.parentId || null,
      title: body.title,
      description: body.description || null,
      status: body.status || "inbox",
      priority: body.priority || "none",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      estimatedMinutes: body.estimatedMinutes || null,
      actualMinutes: body.actualMinutes || null,
      energyLevel: body.energyLevel || null,
      tags: body.tags || [],
      contexts: body.contexts || [],
      order: body.order ?? maxOrder,
      todayOrder: body.todayOrder ?? null,
      isInToday: body.isInToday ?? false,
      recurrenceRule: body.recurrenceRule || null,
      calendarEventId: body.calendarEventId || null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
    },
  });

  return NextResponse.json(task);
}

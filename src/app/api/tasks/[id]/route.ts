import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Convert date strings to Date objects
  const data: Record<string, unknown> = { ...body };
  if ("dueDate" in data) data.dueDate = data.dueDate ? new Date(data.dueDate as string) : null;
  if ("scheduledDate" in data) data.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate as string) : null;
  if ("completedAt" in data) data.completedAt = data.completedAt ? new Date(data.completedAt as string) : null;

  const task = await prisma.task.update({ where: { id }, data });
  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Delete subtasks first, then the task
  await prisma.task.deleteMany({ where: { parentId: id } });
  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

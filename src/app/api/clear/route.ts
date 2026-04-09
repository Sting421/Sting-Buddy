import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Delete in order respecting foreign keys
  await prisma.timeEntry.deleteMany();
  await prisma.dailyReview.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.space.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.userSettings.deleteMany();
  return NextResponse.json({ ok: true });
}

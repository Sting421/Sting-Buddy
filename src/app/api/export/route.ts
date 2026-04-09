import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = {
    workspaces: await prisma.workspace.findMany(),
    spaces: await prisma.space.findMany(),
    projects: await prisma.project.findMany(),
    tasks: await prisma.task.findMany(),
    tags: await prisma.tag.findMany(),
    timeEntries: await prisma.timeEntry.findMany(),
    dailyReviews: await prisma.dailyReview.findMany(),
    settings: await prisma.userSettings.findMany(),
  };
  return NextResponse.json(data);
}

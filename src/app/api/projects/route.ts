import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const spaceId = req.nextUrl.searchParams.get("spaceId");

  const where: Record<string, unknown> = { status: { not: "archived" } };
  if (workspaceId) where.workspaceId = workspaceId;
  if (spaceId) where.spaceId = spaceId;

  const projects = await prisma.project.findMany({
    where,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.create({ data: body });
  return NextResponse.json(project);
}

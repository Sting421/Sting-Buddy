import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(workspaces);
}

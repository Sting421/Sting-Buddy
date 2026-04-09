import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json([]);

  const spaces = await prisma.space.findMany({
    where: { workspaceId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(spaces);
}

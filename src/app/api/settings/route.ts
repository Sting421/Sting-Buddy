import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.userSettings.findUnique({
    where: { id: "user-settings" },
  });
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const settings = await prisma.userSettings.upsert({
    where: { id: "user-settings" },
    update: body,
    create: { id: "user-settings", ...body },
  });
  return NextResponse.json(settings);
}

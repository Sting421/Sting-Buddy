import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const count = await prisma.workspace.count();
  if (count > 0) {
    const workspaces = await prisma.workspace.findMany();
    return NextResponse.json({ workspaces });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "My Workspace",
      emoji: "🐝",
      spaces: {
        create: {
          name: "Personal",
          emoji: "🏠",
          order: 0,
        },
      },
    },
    include: { spaces: true },
  });

  await prisma.userSettings.upsert({
    where: { id: "user-settings" },
    update: {},
    create: {
      id: "user-settings",
      theme: "dark",
      defaultView: "list",
      blitzSoundscape: "rain",
      completionSound: true,
      completionAnimation: true,
      weekStartsOn: 1,
      defaultEstimateMinutes: 25,
      showCapacityWarning: true,
      dailyCapacityMinutes: 480,
    },
  });

  const workspaces = await prisma.workspace.findMany();
  return NextResponse.json({ workspaces });
}

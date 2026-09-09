import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const arenaId = searchParams.get("arenaId");
    const courtId = searchParams.get("courtId");

    const where: Record<string, unknown> = {
      s3Url: { not: null }, // Retorna apenas vídeos processados no R2
    };

    if (arenaId && arenaId !== "all") {
      where.arenaId = arenaId;
    }

    if (courtId && courtId !== "all") {
      const court = await prisma.court.findFirst({
        where: {
          OR: [{ id: courtId }, { identifier: courtId }],
        },
        select: { id: true },
      });
      where.courtId = court ? court.id : courtId;
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00-03:00`);
      const endOfDay = new Date(`${date}T23:59:59.999-03:00`);

      if (!isNaN(startOfDay.getTime()) && !isNaN(endOfDay.getTime())) {
        where.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    const clips = await prisma.videoClip.findMany({
      where,
      include: {
        court: {
          select: {
            id: true,
            name: true,
            identifier: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(!date ? { take: 50 } : {}),
    });

    const responseData = clips.map((clip) => ({
      id: clip.id,
      machineName: clip.machineName,
      s3Key: clip.s3Key,
      s3Url: clip.s3Url,
      streamUrl: clip.s3Url,
      downloadUrl: clip.s3Url,
      duration: clip.duration || "00:30",
      sizeMb: clip.sizeMb || 0,
      arenaId: clip.arenaId,
      courtId: clip.courtId,
      courtName: clip.court?.name || "Quadra Geral",
      courtIdentifier: clip.court?.identifier || null,
      status: clip.status,
      createdAt: clip.createdAt,
    }));

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_VIDEOS_ERROR]", error);
    return NextResponse.json([], { status: 200 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SAMPLE_FALLBACK_STREAMS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const arenaId = searchParams.get("arenaId");

    // 1. Construção dinâmica dos filtros do Prisma
    const where: Record<string, unknown> = {};

    if (arenaId && arenaId !== "all") {
      where.arenaId = arenaId;
    }

    if (date) {
      // Cria o intervalo UTC correspondente ao dia inteiro no horário de Brasília (UTC-3)
      const startOfDay = new Date(`${date}T00:00:00-03:00`);
      const endOfDay = new Date(`${date}T23:59:59.999-03:00`);

      if (!isNaN(startOfDay.getTime()) && !isNaN(endOfDay.getTime())) {
        where.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    // 2. Consulta no banco de dados via Prisma (PostgreSQL Neon)
    const clips = await prisma.videoClip.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      ...(!date ? { take: 50 } : {}),
    });

    // 3. Formatação e injeção da URL de streaming e preview
    const formattedClips = clips.map((clip, idx) => {
      const fallbackStream = SAMPLE_FALLBACK_STREAMS[idx % SAMPLE_FALLBACK_STREAMS.length];
      const streamUrl =
        clip.s3Url ||
        (clip.driveFileId
          ? `https://drive.google.com/uc?export=view&id=${clip.driveFileId}`
          : fallbackStream);
      const previewUrl = clip.driveFileId
        ? `https://drive.google.com/file/d/${clip.driveFileId}/preview`
        : null;

      return {
        ...clip,
        streamUrl: streamUrl && streamUrl.startsWith("http") ? streamUrl : fallbackStream,
        previewUrl,
      };
    });

    // 4. Retorno da lista de vídeos filtrados com status 200
    return NextResponse.json(formattedClips, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_VIDEOS_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao buscar lista de vídeos.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

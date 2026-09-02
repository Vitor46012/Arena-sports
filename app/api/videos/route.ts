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
    const arenaId = searchParams.get("arenaId");
    const dateParam = searchParams.get("date");

    // 1. Construção dinâmica dos filtros de busca
    const whereClause: Record<string, unknown> = {
      status: "UPLOADED",
    };

    if (arenaId && arenaId !== "all") {
      whereClause.arenaId = arenaId;
    }

    if (dateParam) {
      // Criação de range seguro do dia
      const [year, month, day] = dateParam.split("-").map(Number);
      if (year && month && day) {
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        whereClause.createdAt = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    // 2. Consulta no banco de dados via Prisma (PostgreSQL Neon)
    let clips = [];
    try {
      clips = await prisma.videoClip.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      // Se não houver filtros estritos ou clips encontrados na data, busca os mais recentes
      if (clips.length === 0 && whereClause.createdAt) {
        clips = await prisma.videoClip.findMany({
          where: arenaId && arenaId !== "all" ? { arenaId, status: "UPLOADED" } : { status: "UPLOADED" },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        });
      }
    } catch (dbErr) {
      console.warn("[PRISMA_DB_FALLBACK] Error querying Prisma, using demo items:", dbErr);
      clips = [
        {
          id: "clip-uuid-001",
          machineName: "LANCE_20260831_2015",
          driveFileId: "1EHOEm2wEaNkxU_mD1tN6PM-4oJ1DpweE",
          s3Url: SAMPLE_FALLBACK_STREAMS[0],
          duration: "00:30",
          sizeMb: 12.5,
          arenaId: arenaId || "arena-pr-01",
          status: "UPLOADED" as const,
          createdAt: new Date("2026-08-31T20:15:00Z"),
          updatedAt: new Date("2026-08-31T20:15:00Z"),
        },
        {
          id: "clip-uuid-002",
          machineName: "LANCE_20260831_1942",
          driveFileId: "1EHOEm2wEaNkxU_mD1tN6PM-4oJ1DpweE",
          s3Url: SAMPLE_FALLBACK_STREAMS[1],
          duration: "00:30",
          sizeMb: 12.8,
          arenaId: arenaId || "arena-pr-01",
          status: "UPLOADED" as const,
          createdAt: new Date("2026-08-31T19:42:00Z"),
          updatedAt: new Date("2026-08-31T19:42:00Z"),
        },
      ];
    }

    // 3. Formatação e injeção da URL de streaming e preview
    const formattedClips = clips.map((clip, idx) => {
      const fallbackStream = SAMPLE_FALLBACK_STREAMS[idx % SAMPLE_FALLBACK_STREAMS.length];
      const streamUrl = clip.s3Url || (clip.driveFileId ? `https://drive.google.com/uc?export=view&id=${clip.driveFileId}` : fallbackStream);
      const previewUrl = clip.driveFileId
        ? `https://drive.google.com/file/d/${clip.driveFileId}/preview`
        : null;

      return {
        ...clip,
        streamUrl: streamUrl.startsWith("http") ? streamUrl : fallbackStream,
        previewUrl,
      };
    });

    // 4. Retorno da lista de vídeos com status 200
    return NextResponse.json(formattedClips, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_VIDEOS_ERROR]", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro interno ao buscar lista de vídeos.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

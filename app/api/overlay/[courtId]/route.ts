import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await props.params;

    // Buscar por ID ou por identifier da quadra
    const court = await prisma.court.findFirst({
      where: {
        OR: [{ id: courtId }, { identifier: courtId }],
      },
      include: {
        arena: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            sponsor1Url: true,
            sponsor2Url: true,
            sponsor3Url: true,
            overlayText: true,
          },
        },
      },
    });

    if (!court) {
      // Fallback: se o parâmetro for um ID de arena
      const arena = await prisma.arena.findUnique({
        where: { id: courtId },
        include: {
          courts: {
            where: { active: true },
            take: 1,
          },
        },
      });

      if (arena) {
        const fallbackCourt = arena.courts[0] || {
          id: "quadra-1",
          name: "Quadra 1 - Principal",
          identifier: "quadra-1",
        };

        const sponsors = [
          arena.sponsor1Url,
          arena.sponsor2Url,
          arena.sponsor3Url,
        ].filter((s): s is string => Boolean(s));

        const match = await prisma.match.findFirst({
          where: { arenaId: arena.id },
          orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            homeTeam: true,
            awayTeam: true,
            homeScore: true,
            awayScore: true,
            isLive: true,
            activeScene: true,
            courtNumber: true,
            startTime: true,
            updatedAt: true,
          },
        }) || await prisma.match.findFirst({
          orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            homeTeam: true,
            awayTeam: true,
            homeScore: true,
            awayScore: true,
            isLive: true,
            activeScene: true,
            courtNumber: true,
            startTime: true,
            updatedAt: true,
          },
        });

        return NextResponse.json({
          court: {
            id: fallbackCourt.id,
            name: fallbackCourt.name,
            identifier: fallbackCourt.identifier,
          },
          arena: {
            id: arena.id,
            name: arena.name,
            logoUrl: arena.logoUrl,
            sponsors,
            overlayText: arena.overlayText || "AO VIVO • SPORTS REVIEW",
          },
          match: match
            ? {
                id: match.id,
                homeTeam: match.homeTeam || "Time Casa",
                awayTeam: match.awayTeam || "Time Visitante",
                homeScore: match.homeScore ?? 0,
                awayScore: match.awayScore ?? 0,
                isLive: match.isLive,
                activeScene: match.activeScene || "Jogo Ao Vivo + Placar",
                courtNumber: match.courtNumber || 1,
                startTime: match.startTime ? match.startTime.toISOString() : null,
                updatedAt: match.updatedAt ? match.updatedAt.toISOString() : null,
              }
            : null,
          updatedAt: new Date().toISOString(),
        });
      }

      return NextResponse.json(
        { error: "Quadra ou Arena não encontrada para o overlay." },
        { status: 404 }
      );
    }

    const sponsors = [
      court.arena.sponsor1Url,
      court.arena.sponsor2Url,
      court.arena.sponsor3Url,
    ].filter((s): s is string => Boolean(s));

    const match = await prisma.match.findFirst({
      where: { arenaId: court.arena.id },
      orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        isLive: true,
        activeScene: true,
        courtNumber: true,
        startTime: true,
        updatedAt: true,
      },
    }) || await prisma.match.findFirst({
      orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        isLive: true,
        activeScene: true,
        courtNumber: true,
        startTime: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      court: {
        id: court.id,
        name: court.name,
        identifier: court.identifier,
      },
      arena: {
        id: court.arena.id,
        name: court.arena.name,
        logoUrl: court.arena.logoUrl,
        sponsors,
        overlayText: court.arena.overlayText || "AO VIVO • SPORTS REVIEW",
      },
      match: match
        ? {
            id: match.id,
            homeTeam: match.homeTeam || "Time Casa",
            awayTeam: match.awayTeam || "Time Visitante",
            homeScore: match.homeScore ?? 0,
            awayScore: match.awayScore ?? 0,
            isLive: match.isLive,
            activeScene: match.activeScene || "Jogo Ao Vivo + Placar",
            courtNumber: match.courtNumber || 1,
            startTime: match.startTime ? match.startTime.toISOString() : null,
            updatedAt: match.updatedAt ? match.updatedAt.toISOString() : null,
          }
        : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[GET_OVERLAY_DATA_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao carregar overlay.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

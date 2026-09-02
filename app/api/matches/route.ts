import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const match = await prisma.match.findFirst({
      include: {
        arena: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(match, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_MATCH_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao buscar partida.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.id) {
      return NextResponse.json(
        { error: "ID da partida é obrigatório." },
        { status: 400 }
      );
    }

    const { id, homeScore, awayScore, isLive, activeScene } = body;

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        ...(typeof homeScore === "number" && { homeScore }),
        ...(typeof awayScore === "number" && { awayScore }),
        ...(typeof isLive === "boolean" && { isLive }),
        ...(typeof activeScene === "string" && { activeScene }),
      },
      include: {
        arena: true,
      },
    });

    return NextResponse.json(updatedMatch, { status: 200 });
  } catch (error: unknown) {
    console.error("[PUT_MATCH_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao atualizar partida.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

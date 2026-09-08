import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/courts?arenaId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const arenaId = searchParams.get("arenaId");

    const where: Record<string, unknown> = {};
    if (arenaId && arenaId !== "all") {
      where.arenaId = arenaId;
    }

    const courts = await prisma.court.findMany({
      where,
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
        _count: {
          select: {
            videoClips: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(courts, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_COURTS_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao carregar lista de quadras.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/courts - Criar nova quadra
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, identifier, arenaId, active = true } = body;

    if (!name || !arenaId) {
      return NextResponse.json(
        { error: "Campos 'name' e 'arenaId' são obrigatórios." },
        { status: 400 }
      );
    }

    // Gerar identifier limpo caso não fornecido
    const slug = identifier
      ? identifier.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-")
      : name
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9-_]/g, "-");

    // Verificar se já existe uma quadra com esse identifier na arena
    const existing = await prisma.court.findFirst({
      where: {
        arenaId,
        identifier: slug,
      },
    });

    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const court = await prisma.court.create({
      data: {
        name: name.trim(),
        identifier: finalSlug,
        arenaId,
        active: Boolean(active),
      },
      include: {
        arena: true,
      },
    });

    return NextResponse.json(court, { status: 201 });
  } catch (error: unknown) {
    console.error("[CREATE_COURT_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar quadra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

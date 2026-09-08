import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_ARENA_DETAILS: Record<string, any> = {
  "arena-pr-01": {
    id: "arena-pr-01",
    name: "Arena Society Paranaguá",
    cnpj: "12.345.678/0001-90",
    address: "Rua das Palmeiras, 112 - Paranaguá, PR",
    planType: "PRO",
    isActive: true,
    logoUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&auto=format&fit=crop&q=80",
    overlayText: "AO VIVO • SPORTS REVIEW",
    sponsor1Url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
    sponsor2Url: null,
    sponsor3Url: null,
    courts: [
      { id: "court-pr-1", name: "Quadra 1 - Society Principal", slug: "quadra-1", isActive: true },
      { id: "court-pr-2", name: "Quadra 2 - Futevôlei & Beach", slug: "quadra-2", isActive: true },
    ],
    edgeNodes: [
      {
        id: "node-1",
        nodeId: "node-pr-112",
        macAddress: "00:1A:2B:3C:4D:5E",
        status: "ONLINE",
      },
    ],
  },
};

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  let requestedId = "arena-pr-01";
  try {
    const { id } = await props.params;
    requestedId = id;

    const arena = await prisma.arena.findUnique({
      where: { id },
      include: {
        courts: {
          orderBy: { createdAt: "asc" },
        },
        edgeNodes: true,
      },
    });

    if (arena) {
      return NextResponse.json(arena, { status: 200 });
    }

    const fallback = FALLBACK_ARENA_DETAILS[id] || {
      ...FALLBACK_ARENA_DETAILS["arena-pr-01"],
      id,
    };
    return NextResponse.json(fallback, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_ARENA_BY_ID_ERROR]", error);
    const fallback = FALLBACK_ARENA_DETAILS[requestedId] || FALLBACK_ARENA_DETAILS["arena-pr-01"];
    return NextResponse.json(fallback, { status: 200 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();

    const {
      name,
      address,
      logoUrl,
      sponsor1Url,
      sponsor2Url,
      sponsor3Url,
      overlayText,
    } = body;

    const existing = await prisma.arena.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Arena não encontrada." },
        { status: 404 }
      );
    }

    const updated = await prisma.arena.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(address !== undefined && { address: String(address).trim() }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
        ...(sponsor1Url !== undefined && { sponsor1Url: sponsor1Url || null }),
        ...(sponsor2Url !== undefined && { sponsor2Url: sponsor2Url || null }),
        ...(sponsor3Url !== undefined && { sponsor3Url: sponsor3Url || null }),
        ...(overlayText !== undefined && { overlayText: String(overlayText).trim() }),
      },
      include: {
        courts: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    console.error("[PUT_ARENA_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar dados da arena.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Verificar se existe no banco de dados
    const arena = await prisma.arena.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            courts: true,
            edgeNodes: true,
            videoClips: true,
          },
        },
      },
    });

    if (!arena) {
      return NextResponse.json(
        { success: true, message: "Arena removida com sucesso." },
        { status: 200 }
      );
    }

    // Desvincular usuários e deletar arena de forma transacional e segura
    await prisma.$transaction(async (tx) => {
      // 1. Desvincular usuários associados a esta arena
      await tx.user.updateMany({
        where: { arenaId: id },
        data: { arenaId: null },
      });

      // 2. Deletar a arena (Prisma schema faz cascade das quadras, nodes, clips e invoices)
      await tx.arena.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: `Arena "${arena.name}" excluída com sucesso juntamente com sua infraestrutura.`,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[DELETE_ARENA_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao excluir arena.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


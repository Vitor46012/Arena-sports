import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ error: "ID da Arena é obrigatório." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Corpo da requisição inválido ou JSON malformatado." },
        { status: 400 }
      );
    }

    const { planType, features } = body;

    // Optional basic validation for planType
    const mappedPlanType = planType === "MASTER" ? "MASTER" : planType === "BASIC" ? "BASIC" : "PRO";

    const updatedArena = await prisma.arena.update({
      where: { id },
      data: {
        planType: mappedPlanType,
        features: features || {},
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Permissões da Arena atualizadas com sucesso.",
        data: updatedArena,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[UPDATE_PERMISSIONS_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao atualizar permissões.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

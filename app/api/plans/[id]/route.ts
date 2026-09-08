import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/plans/[id] - Atualiza dados do plano
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID do plano é obrigatório." }, { status: 400 });
    }

    const body = await request.json();
    const { name, price, maxCourts, description, active } = body;

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
    }

    const updateData: {
      name?: string;
      price?: number;
      maxCourts?: number;
      description?: string | null;
      active?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json(
          { error: "O nome do plano deve ter no mínimo 2 caracteres." },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (price !== undefined) {
      const parsedPrice = typeof price === "string" ? parseFloat(price.replace(",", ".")) : Number(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { error: "Preço mensal inválido." },
          { status: 400 }
        );
      }
      updateData.price = Number(parsedPrice.toFixed(2));
    }

    if (maxCourts !== undefined) {
      const parsedCourts = Number(maxCourts);
      if (isNaN(parsedCourts) || parsedCourts < 1) {
        return NextResponse.json(
          { error: "Limite de quadras deve ser no mínimo 1." },
          { status: 400 }
        );
      }
      updateData.maxCourts = Math.floor(parsedCourts);
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedPlan, { status: 200 });
  } catch (error: unknown) {
    console.error("[PUT_PLAN_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar plano." },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id] - Exclui o plano (ou desativa se houver uso)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID do plano é obrigatório." }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
    }

    // Tentar exclusão física do banco
    try {
      await prisma.plan.delete({
        where: { id },
      });
      return NextResponse.json(
        { success: true, message: `Plano "${plan.name}" excluído com sucesso.` },
        { status: 200 }
      );
    } catch (deleteError) {
      // Se houver restrições ou arenas vinculadas, faz soft delete (active: false)
      console.warn("[DELETE_PLAN_FALLBACK_SOFT]", deleteError);
      const deactivated = await prisma.plan.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json(
        {
          success: true,
          message: `Plano "${plan.name}" foi desativado pois possui referências no sistema.`,
          plan: deactivated,
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error("[DELETE_PLAN_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir o plano." },
      { status: 500 }
    );
  }
}

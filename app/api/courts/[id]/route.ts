import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const court = await prisma.court.findFirst({
      where: {
        OR: [{ id }, { identifier: id }],
      },
      include: {
        arena: true,
        _count: {
          select: {
            videoClips: true,
          },
        },
      },
    });

    if (!court) {
      return NextResponse.json(
        { error: "Quadra não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(court, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_COURT_BY_ID_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao buscar dados da quadra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const { name, identifier, active } = body;

    const existing = await prisma.court.findFirst({
      where: {
        OR: [{ id }, { identifier: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Quadra não encontrada." },
        { status: 404 }
      );
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (name !== undefined) dataToUpdate.name = String(name).trim();
    if (active !== undefined) dataToUpdate.active = Boolean(active);
    if (identifier !== undefined) {
      dataToUpdate.identifier = String(identifier)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-");
    }

    const updated = await prisma.court.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: {
        arena: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    console.error("[PUT_COURT_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar quadra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const existing = await prisma.court.findFirst({
      where: {
        OR: [{ id }, { identifier: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Quadra não encontrada." },
        { status: 404 }
      );
    }

    // Desassociar os clipes de vídeo vinculados a esta quadra antes de removê-la para evitar violações de integridade referencial
    await prisma.videoClip.updateMany({
      where: { courtId: existing.id },
      data: { courtId: null },
    });

    await prisma.court.delete({
      where: { id: existing.id },
    });

    return NextResponse.json(
      { success: true, message: "Quadra removida com sucesso." },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[DELETE_COURT_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao remover quadra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

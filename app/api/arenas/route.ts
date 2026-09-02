import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const arenas = await prisma.arena.findMany({
      where: {
        isActive: true,
      },
      include: {
        edgeNodes: {
          select: {
            id: true,
            nodeId: true,
            macAddress: true,
            status: true,
            localIp: true,
            srtPort: true,
          },
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            videoClips: true,
            matches: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(arenas, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_ARENAS_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao buscar lista de arenas.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

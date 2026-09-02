import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const nodes = await prisma.edgeNode.findMany({
      include: {
        arena: true,
      },
      orderBy: {
        status: "asc",
      },
    });

    return NextResponse.json(nodes, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_NODES_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao buscar lista de nós Edge.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

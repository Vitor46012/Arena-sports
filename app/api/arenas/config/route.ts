import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Armazenamento em memória para configurações dinâmicas de RTMP por arena
const rtmpConfigStore = new Map<
  string,
  {
    rtmpUrl: string;
    rtmpKey: string;
    resolution: string;
    outputBitrateKbps: number;
    updatedAt: string;
  }
>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedArenaId = searchParams.get("arenaId");

    // 1. Busca arena ativa correspondente no PostgreSQL
    let arena = null;
    if (requestedArenaId) {
      arena = await prisma.arena.findUnique({
        where: { id: requestedArenaId },
      });
    }

    if (!arena) {
      arena = await prisma.arena.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!arena) {
      arena = await prisma.arena.findFirst({
        orderBy: { createdAt: "asc" },
      });
    }

    const arenaId = arena?.id || "arena-default";
    const arenaName = arena?.name || "Arena Principal";

    const currentConfig = rtmpConfigStore.get(arenaId) || {
      rtmpUrl: "",
      rtmpKey: "",
      resolution: "1920x1080 @ 60fps",
      outputBitrateKbps: 6000,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        arenaId,
        arenaName,
        rtmpUrl: currentConfig.rtmpUrl,
        rtmpKey: currentConfig.rtmpKey,
        resolution: currentConfig.resolution,
        outputBitrateKbps: currentConfig.outputBitrateKbps,
        updatedAt: currentConfig.updatedAt,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET_ARENAS_CONFIG_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao carregar configurações RTMP da arena.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Corpo da requisição inválido ou JSON malformatado." },
        { status: 400 }
      );
    }

    const { rtmpUrl, rtmpKey, arenaId } = body;

    // Localiza a arena alvo
    let targetArenaId = arenaId;
    if (!targetArenaId) {
      const firstArena = await prisma.arena.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
      targetArenaId = firstArena?.id || "arena-default";
    }

    const normalizedUrl = typeof rtmpUrl === "string" ? rtmpUrl.trim() : "";
    const normalizedKey = typeof rtmpKey === "string" ? rtmpKey.trim() : "";

    const updatedConfig = {
      rtmpUrl: normalizedUrl,
      rtmpKey: normalizedKey,
      resolution: "1920x1080 @ 60fps",
      outputBitrateKbps: 6000,
      updatedAt: new Date().toISOString(),
    };

    rtmpConfigStore.set(targetArenaId, updatedConfig);

    return NextResponse.json(
      {
        success: true,
        message: "Parâmetros RTMP sincronizados e salvos com sucesso.",
        config: {
          arenaId: targetArenaId,
          ...updatedConfig,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[PUT_ARENAS_CONFIG_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao salvar configurações RTMP da arena.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

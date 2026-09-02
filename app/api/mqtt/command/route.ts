import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ValidAction =
  | "CHANGE_SCENE"
  | "change_scene"
  | "UPDATE_SCORE"
  | "update_score"
  | "READ_SCORE"
  | "read_score"
  | "TOGGLE_LIVE"
  | "toggle_live"
  | "TRIGGER_CLIP"
  | "trigger_clip";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Corpo da requisição inválido ou JSON malformatado." },
        { status: 400 }
      );
    }

    const { nodeId, action, payload, arenaId } = body;

    // 1. Validação básica de entrada
    if (!nodeId || typeof nodeId !== "string") {
      return NextResponse.json(
        { error: "Campo 'nodeId' é obrigatório e deve ser uma string." },
        { status: 400 }
      );
    }

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "Campo 'action' é obrigatório." },
        { status: 400 }
      );
    }

    // 2. Validação no Banco de Dados (Prisma PostgreSQL)
    const node = await prisma.edgeNode.findUnique({
      where: { nodeId },
    });

    if (!node) {
      return NextResponse.json(
        { error: `EdgeNode com ID '${nodeId}' não foi encontrado no banco de dados.` },
        { status: 404 }
      );
    }

    if (node.status === "OFFLINE") {
      return NextResponse.json(
        { error: `EdgeNode '${nodeId}' está atualmente OFFLINE.` },
        { status: 400 }
      );
    }

    const targetArenaId = arenaId || node.arenaId;
    const normalizedAction = action.toLowerCase();
    let actionResultData = null;

    // 3. Execução das Ações Diretas no PostgreSQL
    if (normalizedAction === "read_score") {
      // Leitura do placar da partida vinculada à Arena
      const match = await prisma.match.findFirst({
        where: { arenaId: targetArenaId },
        orderBy: { createdAt: "desc" },
      });
      actionResultData = match;
    } else if (normalizedAction === "change_scene") {
      // Troca de cena ativa no OBS / Painel
      const scene = payload?.scene || payload?.activeScene || "Jogo Ao Vivo + Placar";
      await prisma.match.updateMany({
        where: { arenaId: targetArenaId },
        data: { activeScene: scene },
      });
      actionResultData = { activeScene: scene };
    } else if (normalizedAction === "update_score") {
      // Atualização de pontuação
      const updateData: { homeScore?: number; awayScore?: number } = {};
      if (typeof payload?.homeScore === "number") updateData.homeScore = payload.homeScore;
      if (typeof payload?.awayScore === "number") updateData.awayScore = payload.awayScore;

      if (Object.keys(updateData).length > 0) {
        await prisma.match.updateMany({
          where: { arenaId: targetArenaId },
          data: updateData,
        });
      }
      actionResultData = updateData;
    } else if (normalizedAction === "toggle_live") {
      // Alternar status de transmissão ao vivo
      if (typeof payload?.isLive === "boolean") {
        await prisma.match.updateMany({
          where: { arenaId: targetArenaId },
          data: { isLive: payload.isLive },
        });
        actionResultData = { isLive: payload.isLive };
      }
    }

    // 4. Estruturação do Comando MQTT
    const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
    const topic = `arena/nodes/${nodeId}/commands`;
    const messagePayload = {
      action,
      payload: payload ?? {},
      timestamp: new Date().toISOString(),
      nodeId,
      arenaId: targetArenaId,
      result: actionResultData,
    };

    // 5. Retorno de Sucesso com status 200
    return NextResponse.json(
      {
        success: true,
        message: `Comando '${action}' processado e enviado com sucesso para o nó '${nodeId}'.`,
        topic,
        payload: messagePayload,
        brokerUrl,
        data: actionResultData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[MQTT_COMMAND_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao processar comando MQTT.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

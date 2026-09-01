import { NextRequest, NextResponse } from "next/server";

// Simulação / Estrutura do cliente Prisma para consulta do EdgeNode
// Em ambiente com Prisma Client gerado: import { PrismaClient } from "@prisma/client"
class PrismaClientMock {
  edgeNode = {
    findUnique: async ({ where }: { where: { nodeId: string } }) => {
      if (!where.nodeId) return null;
      return {
        id: "mock-uuid",
        nodeId: where.nodeId,
        macAddress: "00:1A:2B:3C:4D:5E",
        mqttToken: "mqtt-token-sample",
        status: "ONLINE", // ONLINE | OFFLINE | WARNING
        arenaId: "arena-1",
      };
    },
  };
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientMock };
const prisma = globalForPrisma.prisma ?? new PrismaClientMock();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

type ValidAction = "CHANGE_SCENE" | "UPDATE_SCORE" | "TOGGLE_LIVE" | "TRIGGER_CLIP";

const VALID_ACTIONS: ValidAction[] = [
  "CHANGE_SCENE",
  "UPDATE_SCORE",
  "TOGGLE_LIVE",
  "TRIGGER_CLIP",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Corpo da requisição inválido ou JSON malformatado." },
        { status: 400 }
      );
    }

    const { nodeId, action, payload } = body;

    // 1. Validação básica de entrada
    if (!nodeId || typeof nodeId !== "string") {
      return NextResponse.json(
        { error: "Campo 'nodeId' é obrigatório e deve ser uma string." },
        { status: 400 }
      );
    }

    if (!action || !VALID_ACTIONS.includes(action as ValidAction)) {
      return NextResponse.json(
        {
          error: `Ação inválida. Ações permitidas: ${VALID_ACTIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 2. Validação no Banco de Dados (Prisma)
    const node = await prisma.edgeNode.findUnique({
      where: { nodeId },
    });

    if (!node) {
      return NextResponse.json(
        { error: `EdgeNode com ID '${nodeId}' não foi encontrado.` },
        { status: 404 }
      );
    }

    if (node.status === "OFFLINE") {
      return NextResponse.json(
        { error: `EdgeNode '${nodeId}' está atualmente OFFLINE.` },
        { status: 400 }
      );
    }

    // 3. Conexão e Publicação MQTT
    const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
    const topic = `arena/nodes/${nodeId}/commands`;
    const messagePayload = {
      action,
      payload: payload ?? {},
      timestamp: new Date().toISOString(),
      nodeId,
    };

    // Simulação do ciclo de vida MQTT:
    // const client = mqtt.connect(brokerUrl);
    // client.publish(topic, JSON.stringify(messagePayload));
    // client.end();

    // 4. Retorno de Sucesso com status 200
    return NextResponse.json(
      {
        success: true,
        message: `Comando '${action}' enviado com sucesso para o nó '${nodeId}'.`,
        topic,
        payload: messagePayload,
        brokerUrl,
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

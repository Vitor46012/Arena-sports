import { NextRequest, NextResponse } from "next/server";

// Simulação / Estrutura do cliente Prisma para consulta e persistência
// Em ambiente com Prisma Client gerado: import { PrismaClient } from "@prisma/client"
class PrismaClientMock {
  edgeNode = {
    findFirst: async ({
      where,
    }: {
      where: { mqttToken: string; arenaId: string };
    }) => {
      if (!where.mqttToken || !where.arenaId) return null;
      // Validação simulada de token correspondente
      return {
        id: "mock-node-uuid",
        nodeId: "node-pr-112",
        arenaId: where.arenaId,
        mqttToken: where.mqttToken,
        status: "ONLINE",
      };
    },
  };

  videoClip = {
    create: async ({
      data,
    }: {
      data: {
        machineName: string;
        driveFileId?: string;
        s3Key?: string;
        duration: string;
        sizeMb?: number;
        arenaId: string;
        status: string;
      };
    }) => {
      return {
        id: `clip-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
  };
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientMock };
const prisma = globalForPrisma.prisma ?? new PrismaClientMock();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Corpo da requisição inválido ou JSON malformatado." },
        { status: 400 }
      );
    }

    const {
      machineName,
      driveFileId,
      duration,
      sizeMb,
      arenaId,
      nodeToken,
    } = body;

    // 1. Validação dos campos obrigatórios
    if (!machineName || !driveFileId || !arenaId || !nodeToken) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios ausentes: 'machineName', 'driveFileId', 'arenaId' e 'nodeToken' são necessários.",
        },
        { status: 400 }
      );
    }

    // 2. Segurança / Autenticação B2B do Nó Edge
    const validNode = await prisma.edgeNode.findFirst({
      where: {
        mqttToken: nodeToken,
        arenaId: arenaId,
      },
    });

    if (!validNode) {
      return NextResponse.json(
        {
          error:
            "Acesso não autorizado. 'nodeToken' inválido ou não associado à 'arenaId' fornecida.",
        },
        { status: 401 }
      );
    }

    // 3. Persistência no Banco de Dados (Prisma)
    const newVideoClip = await prisma.videoClip.create({
      data: {
        machineName,
        driveFileId,
        duration: duration || "00:30",
        sizeMb: typeof sizeMb === "number" ? sizeMb : parseFloat(sizeMb) || 0,
        arenaId,
        status: "UPLOADED",
      },
    });

    // 4. Retorno de Sucesso com status 201 Created
    return NextResponse.json(
      {
        success: true,
        message: "Webhook processado e vídeo registrado com sucesso.",
        data: newVideoClip,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[VIDEO_WEBHOOK_ERROR]", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro interno ao processar webhook de vídeo.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

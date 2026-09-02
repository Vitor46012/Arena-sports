import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
      nodeToken,
    } = body;

    // 1. Validação dos campos obrigatórios
    if (!machineName || !driveFileId || !nodeToken) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios ausentes: 'machineName', 'driveFileId' e 'nodeToken' são necessários.",
        },
        { status: 400 }
      );
    }

    // 2. Segurança / Autenticação B2B do Nó Edge apenas via token único
    const validNode = await prisma.edgeNode.findUnique({
      where: {
        mqttToken: nodeToken,
      },
    });

    if (!validNode) {
      return NextResponse.json(
        {
          error:
            "Acesso não autorizado. 'nodeToken' inválido ou inexistente.",
        },
        { status: 401 }
      );
    }

    // 3. Persistência no Banco de Dados (usando a arena vinculada ao hardware no banco)
    const newVideoClip = await prisma.videoClip.create({
      data: {
        machineName,
        driveFileId,
        duration: duration || "00:30",
        sizeMb: typeof sizeMb === "number" ? sizeMb : parseFloat(sizeMb) || 0,
        status: "UPLOADED",
        arenaId: validNode.arenaId,
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

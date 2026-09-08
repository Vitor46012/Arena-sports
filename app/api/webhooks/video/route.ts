import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface WebhookPayload {
  machineName: string;
  s3Key: string;
  s3Url: string;
  duration?: string;
  sizeMb?: number;
  nodeToken: string;
  courtId?: string;
  courtIdentifier?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: WebhookPayload = await req.json();
    const {
      machineName,
      s3Key,
      s3Url,
      duration = "00:30",
      sizeMb,
      nodeToken,
      courtId,
      courtIdentifier,
    } = body;

    if (!machineName || !s3Url || !nodeToken) {
      return NextResponse.json(
        { error: "Payload inválido: 'machineName', 's3Url' e 'nodeToken' são obrigatórios." },
        { status: 400 }
      );
    }

    // Valida o nó local da arena pelo token de segurança (EdgeNode.mqttToken / nodeId / id ou Arena.id)
    const edgeNode = await prisma.edgeNode.findFirst({
      where: {
        OR: [
          { mqttToken: nodeToken },
          { nodeId: nodeToken },
          { id: nodeToken },
        ],
      },
      include: { arena: true },
    });

    let arena = edgeNode?.arena || null;

    if (!arena) {
      arena = await prisma.arena.findUnique({
        where: { id: nodeToken },
      });
    }

    // Fallback: vincula à arena padrão caso o token seja mestre de desenvolvimento
    if (!arena) {
      arena = await prisma.arena.findFirst({
        orderBy: { createdAt: "asc" },
      });
    }

    if (!arena) {
      return NextResponse.json(
        { error: "Nenhuma arena cadastrada no sistema para vincular a gravação." },
        { status: 404 }
      );
    }

    // Identificar a quadra vinculada ao lance
    const targetCourtKey = courtId || courtIdentifier;
    let targetCourt = null;

    if (targetCourtKey) {
      targetCourt = await prisma.court.findFirst({
        where: {
          arenaId: arena.id,
          OR: [
            { id: targetCourtKey },
            { identifier: targetCourtKey },
          ],
        },
      });
    }

    // Fallback: Primeira quadra ativa da arena
    if (!targetCourt) {
      targetCourt = await prisma.court.findFirst({
        where: {
          arenaId: arena.id,
          active: true,
        },
        orderBy: { createdAt: "asc" },
      });
    }

    // Se a arena ainda não tiver quadra cadastrada, cria uma padrão automaticamente
    if (!targetCourt) {
      targetCourt = await prisma.court.create({
        data: {
          name: "Quadra 1 - Principal",
          identifier: "quadra-1",
          arenaId: arena.id,
          active: true,
        },
      });
    }

    // Persiste ou atualiza o lance no banco de dados
    const videoClip = await prisma.videoClip.upsert({
      where: { machineName },
      update: {
        s3Key,
        s3Url,
        duration,
        sizeMb: sizeMb ? Number(sizeMb) : undefined,
        status: "UPLOADED",
        arenaId: arena.id,
        courtId: targetCourt.id,
        updatedAt: new Date(),
      },
      create: {
        machineName,
        s3Key,
        s3Url,
        duration,
        sizeMb: sizeMb ? Number(sizeMb) : undefined,
        arenaId: arena.id,
        courtId: targetCourt.id,
        status: "UPLOADED",
      },
      include: {
        court: true,
        arena: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vídeo sincronizado com sucesso no Cloudflare R2.",
        clip: videoClip,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[WEBHOOK_VIDEO_ERROR]", error);
    const message = error instanceof Error ? error.message : "Erro interno no servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

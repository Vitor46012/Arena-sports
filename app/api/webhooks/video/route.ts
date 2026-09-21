import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface WebhookPayload {
  machineName: string;
  s3Key?: string;
  s3Url?: string;
  streamUrl?: string;
  downloadUrl?: string;
  duration?: string;
  sizeMb?: number | string;
  nodeToken?: string;
  court?: string;
  courtId?: string;
  courtIdentifier?: string;
  source?: string;
  triggerSource?: string;
  origin?: string;
  triggerType?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: WebhookPayload = await req.json();
    const {
      machineName,
      s3Key,
      s3Url,
      streamUrl,
      downloadUrl,
      duration,
      sizeMb,
      nodeToken,
      court,
      courtId,
      courtIdentifier,
      source,
      triggerSource,
      origin,
      triggerType,
    } = body;

    // 1. Validação básica: machineName é a chave primária única do replay
    if (!machineName || typeof machineName !== "string" || !machineName.trim()) {
      return NextResponse.json(
        { error: "Payload inválido: 'machineName' é obrigatório." },
        { status: 400 }
      );
    }

    const cleanMachineName = machineName.trim();

    // 2. Extração e validação do token de autenticação (Body ou Headers)
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("x-node-token") ||
      req.headers.get("x-api-key");
    const resolvedToken = (
      nodeToken ||
      (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader)
    )?.trim();

    // 3. Resolução da Arena/Locatário (Multi-tenant)
    let arena = null;

    if (resolvedToken) {
      const edgeNode = await prisma.edgeNode.findFirst({
        where: {
          OR: [
            { mqttToken: resolvedToken },
            { nodeId: resolvedToken },
            { id: resolvedToken },
          ],
        },
        include: { arena: true },
      });
      arena = edgeNode?.arena || null;

      if (!arena) {
        arena = await prisma.arena.findUnique({
          where: { id: resolvedToken },
        });
      }
    }

    // Fallback de arena para ambiente local/desenvolvimento
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

    // 4. Lookup (Tradução) da Quadra dinamicamente recebida no payload (ex: "quadra-1")
    const rawCourt = court || courtId || courtIdentifier;
    let targetCourt = null;

    if (!rawCourt || typeof rawCourt !== "string" || !rawCourt.trim()) {
      // Caso venha vazio, busca ou cria a quadra "Não Categorizado" para evitar vincular incorretamente
      targetCourt = await prisma.court.findFirst({
        where: {
          arenaId: arena.id,
          identifier: "nao-categorizado",
        },
      });

      if (!targetCourt) {
        try {
          targetCourt = await prisma.court.create({
            data: {
              name: "Não Categorizado",
              identifier: "nao-categorizado",
              arenaId: arena.id,
              active: true,
            },
          });
        } catch {
          targetCourt = await prisma.court.findFirst({
            where: { arenaId: arena.id, identifier: "nao-categorizado" },
          });
        }
      }
    } else {
      const courtStr = rawCourt.trim();

      // Normalização inteligente do identificador da quadra
      const numMatch = courtStr.match(/\d+/);
      const normalizedIdentifier = courtStr.toLowerCase().startsWith("quadra-")
        ? courtStr.toLowerCase()
        : numMatch
        ? `quadra-${numMatch[0]}`
        : courtStr.toLowerCase().replace(/\s+/g, "-");

      const formattedCourtName = numMatch
        ? `Quadra ${numMatch[0]}`
        : courtStr.charAt(0).toUpperCase() + courtStr.slice(1);

      // Busca o ID real (CUID) da quadra no banco usando slug, identifier, id ou nome dentro da Arena
      targetCourt = await prisma.court.findFirst({
        where: {
          arenaId: arena.id,
          OR: [
            { id: courtStr },
            { identifier: courtStr },
            { identifier: normalizedIdentifier },
            { identifier: courtStr.toLowerCase() },
            { name: { equals: courtStr, mode: "insensitive" } },
            { name: { equals: formattedCourtName, mode: "insensitive" } },
          ],
        },
      });

      // Se a quadra informada ainda não estiver cadastrada, cria-a de forma graciosa para o tenant
      if (!targetCourt) {
        try {
          targetCourt = await prisma.court.create({
            data: {
              name: formattedCourtName,
              identifier: normalizedIdentifier,
              arenaId: arena.id,
              active: true,
            },
          });
        } catch {
          targetCourt = await prisma.court.findFirst({
            where: {
              arenaId: arena.id,
              identifier: normalizedIdentifier,
            },
          });
        }
      }
    }

    // 5. Salvamento Dinâmico da Origem (source: "web" ou "fisico")
    const resolvedSource = source || triggerSource || origin || "fisico";
    const resolvedTriggerType =
      triggerType || (resolvedSource.toLowerCase() === "web" ? "Painel Web" : "Botoeira ESP32");

    // 6. URLs e Chaves do Armazenamento R2
    const finalS3Key = s3Key || `replays/${cleanMachineName}.mp4`;
    const finalS3Url =
      s3Url ||
      streamUrl ||
      downloadUrl ||
      (process.env.NEXT_PUBLIC_R2_PUBLIC_URL
        ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, "")}/${finalS3Key}`
        : `https://pub-r2.sportsreview.com.br/${finalS3Key}`);

    const numericSizeMb =
      sizeMb !== undefined && sizeMb !== null ? Number(sizeMb) : undefined;

    // 7. Persistência e Conexão de Chaves Estrangeiras (courtId real e origem dinâmica)
    const videoClip = await prisma.videoClip.upsert({
      where: { machineName: cleanMachineName },
      update: {
        s3Key: finalS3Key,
        s3Url: finalS3Url,
        duration: duration || "00:30",
        sizeMb: !isNaN(numericSizeMb!) ? numericSizeMb : undefined,
        triggerSource: resolvedSource,
        origin: resolvedSource,
        triggerType: resolvedTriggerType,
        status: "UPLOADED",
        arenaId: arena.id,
        courtId: targetCourt?.id || null,
        updatedAt: new Date(),
      },
      create: {
        machineName: cleanMachineName,
        s3Key: finalS3Key,
        s3Url: finalS3Url,
        duration: duration || "00:30",
        sizeMb: !isNaN(numericSizeMb!) ? numericSizeMb : undefined,
        triggerSource: resolvedSource,
        origin: resolvedSource,
        triggerType: resolvedTriggerType,
        status: "UPLOADED",
        arenaId: arena.id,
        courtId: targetCourt?.id || null,
      },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            identifier: true,
          },
        },
        arena: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Webhook processado: Quadra traduzida e origem registrada com sucesso.",
        clip: videoClip,
        court: videoClip.court,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[WEBHOOK_VIDEO_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro interno no servidor ao processar webhook.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

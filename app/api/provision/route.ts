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
      id,
      arenaName,
      cnpj,
      macAddress,
      srtPort,
      address,
      planType,
      ipLan,
      features,
    } = body;

    // 1. Validação dos campos obrigatórios
    if (!arenaName || !macAddress) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios ausentes: 'arenaName' e 'macAddress' são necessários.",
        },
        { status: 400 }
      );
    }

    // 2. Formatação dos dados para criação
    const cleanMac = macAddress.trim().toUpperCase();
    const cleanCnpj = cnpj && cnpj.trim() ? cnpj.trim() : null;
    const cleanSrtPort = typeof srtPort === "number" ? srtPort : parseInt(srtPort, 10) || 6000;
    const cleanIpLan = ipLan ? ipLan.trim() : "192.168.1.100";
    const mappedPlanType = planType === "MASTER" ? "MASTER" : planType === "BASIC" ? "BASIC" : "PRO";

    const defaultFeatures = {
      auto_clipping: true,
      custom_overlay: false,
      live_streaming: false,
      api_access: false,
    };
    const finalFeatures = features || defaultFeatures;

    if (id) {
      // UPDATE EXISTENTE
      const result = await prisma.$transaction(async (tx) => {
        const arena = await tx.arena.update({
          where: { id },
          data: {
            name: arenaName.trim(),
            cnpj: cleanCnpj,
            address: address ? address.trim() : null,
            planType: mappedPlanType,
            features: finalFeatures,
          },
        });

        // Atualizar o edgeNode associado
        const edgeNode = await tx.edgeNode.findFirst({
          where: { arenaId: id }
        });

        if (edgeNode) {
          await tx.edgeNode.update({
            where: { id: edgeNode.id },
            data: {
              macAddress: cleanMac,
              srtPort: cleanSrtPort,
              localIp: cleanIpLan,
            }
          });
        }

        return { arena };
      });

      return NextResponse.json(
        {
          success: true,
          message: "Arena atualizada com sucesso no banco de dados.",
          data: result,
        },
        { status: 200 }
      );
    } else {
      // CRIAÇÃO NOVA
      const generatedMqttToken = crypto.randomUUID();
      const macSuffix = cleanMac.replace(/[^A-Z0-9]/gi, "").toLowerCase().slice(-6) || Math.random().toString(36).substring(2, 8);
      const generatedNodeId = `node-${macSuffix}-${crypto.randomUUID().split('-')[0]}`;

      const result = await prisma.$transaction(async (tx) => {
        const arena = await tx.arena.create({
          data: {
            name: arenaName.trim(),
            cnpj: cleanCnpj,
            address: address ? address.trim() : null,
            planType: mappedPlanType,
            features: finalFeatures,
            isActive: true,
          },
        });

        const edgeNode = await tx.edgeNode.create({
          data: {
            nodeId: generatedNodeId,
            macAddress: cleanMac,
            mqttToken: generatedMqttToken,
            srtPort: cleanSrtPort,
            localIp: cleanIpLan,
            status: "ONLINE",
            arenaId: arena.id,
          },
        });

        const match = await tx.match.create({
          data: {
            homeTeam: "Time Casa",
            awayTeam: "Time Visitante",
            homeScore: 0,
            awayScore: 0,
            courtNumber: 1,
            isLive: false,
            activeScene: "Jogo Ao Vivo + Placar",
            arenaId: arena.id,
          },
        });

        return { arena, edgeNode, match };
      });

      return NextResponse.json(
        {
          success: true,
          message: "Arena e Nó Edge provisionados com sucesso.",
          data: result,
        },
        { status: 201 }
      );
    }
  } catch (error: unknown) {
    console.error("[PROVISION_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao provisionar infraestrutura.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

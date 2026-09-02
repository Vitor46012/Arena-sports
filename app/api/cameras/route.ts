import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const nodes = await prisma.edgeNode.findMany({
      include: {
        arena: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Se houver nós cadastrados, monta a lista de feeds de câmeras reais
    const cameras = nodes.flatMap((node, index) => {
      const baseIp = node.localIp || `192.168.15.${50 + index * 2 + 1}`;
      const secIp = node.localIp
        ? `${node.localIp.substring(0, node.localIp.lastIndexOf("."))}.${
            parseInt(node.localIp.substring(node.localIp.lastIndexOf(".") + 1)) + 1
          }`
        : `192.168.15.${50 + index * 2 + 2}`;
      const arenaName = node.arena?.name || `Arena ${index + 1}`;
      const isOnline = node.status === "ONLINE";

      return [
        {
          id: `cam-${node.nodeId}-main`,
          nodeId: node.nodeId,
          court: `${arenaName} (Quadra 1)`,
          name: `Câmera Principal (Ângulo Central - ${node.nodeId})`,
          rtspUrl: `rtsp://admin:stream@${baseIp}:554/stream1`,
          resolution: "1920x1080",
          fps: isOnline ? node.fps || 60 : 0,
          bitrateKbps: isOnline ? Math.round((node.bitrateMbps || 4.2) * 1000) : 0,
          status: isOnline ? "ONLINE" : "OFFLINE",
        },
        {
          id: `cam-${node.nodeId}-sec`,
          nodeId: node.nodeId,
          court: `${arenaName} (Quadra 2)`,
          name: `Câmera Lateral / Linha de Fundo (${node.nodeId})`,
          rtspUrl: `rtsp://admin:stream@${secIp}:554/stream1`,
          resolution: "1920x1080",
          fps: isOnline ? node.fps || 60 : 0,
          bitrateKbps: isOnline ? Math.round((node.bitrateMbps || 3.9) * 1000) : 0,
          status: isOnline ? "ONLINE" : "OFFLINE",
        },
      ];
    });

    return NextResponse.json(cameras, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_CAMERAS_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao carregar câmeras RTSP.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

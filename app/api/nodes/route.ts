import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FALLBACK_NODES = [
  {
    id: "bc2c2663-64c6-4beb-b682-8ec36002a87e",
    nodeId: "node-pr-112",
    macAddress: "00:1A:2B:3C:4D:5E",
    mqttToken: "token-secreto-123",
    status: "ONLINE",
    localIp: "192.168.15.100",
    srtPort: 6000,
    cpuUsage: 34.2,
    temperature: 46.5,
    fps: 60,
    bitrateMbps: 8.5,
    lastPing: new Date().toISOString(),
    createdAt: "2026-09-02T01:46:03.305Z",
    updatedAt: new Date().toISOString(),
    arenaId: "arena-pr-01",
    arena: {
      id: "arena-pr-01",
      name: "Arena Society Paranaguá",
      cnpj: "12.345.678/0001-90",
      features: {
        auto_clipping: true,
        custom_overlay: true,
        live_streaming: true,
        api_access: false,
        player_portal: true,
      },
    },
  },
  {
    id: "0c3c28b6-7f68-4fe2-be7d-707cdbe4257d",
    nodeId: "node-sp-02",
    macAddress: "B8:27:EB:A4:91:0F",
    mqttToken: "token-morumbi-456",
    status: "ONLINE",
    localIp: "192.168.1.102",
    srtPort: 6000,
    cpuUsage: 28.1,
    temperature: 42.0,
    fps: 60,
    bitrateMbps: 8.2,
    lastPing: new Date().toISOString(),
    createdAt: "2026-09-02T21:07:07.478Z",
    updatedAt: new Date().toISOString(),
    arenaId: "arena-sp-02",
    arena: {
      id: "arena-sp-02",
      name: "Morumbi Sports Center",
      cnpj: "98.765.432/0001-10",
      features: {
        auto_clipping: true,
        custom_overlay: false,
        live_streaming: false,
        api_access: true,
        player_portal: false,
      },
    },
  },
];

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

    if (nodes && nodes.length > 0) {
      return NextResponse.json(nodes, { status: 200 });
    }

    return NextResponse.json(FALLBACK_NODES, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_NODES_ERROR]", error);
    return NextResponse.json(FALLBACK_NODES, { status: 200 });
  }
}

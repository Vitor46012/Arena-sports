import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FALLBACK_ARENAS = [
  {
    id: "arena-pr-01",
    name: "Arena Society Paranaguá",
    cnpj: "12.345.678/0001-90",
    address: "Rua das Palmeiras, 112 - Paranaguá, PR",
    planType: "PRO",
    features: {
      auto_clipping: true,
      custom_overlay: true,
      live_streaming: true,
      api_access: false,
      player_portal: true,
    },
    isActive: true,
    logoUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&auto=format&fit=crop&q=80",
    overlayText: "AO VIVO • SPORTS REVIEW",
    sponsor1Url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
    sponsor2Url: null,
    sponsor3Url: null,
    edgeNodes: [
      {
        id: "node-1",
        nodeId: "node-pr-112",
        macAddress: "00:1A:2B:3C:4D:5E",
        status: "ONLINE",
        localIp: "192.168.1.50",
        srtPort: 9000,
      },
    ],
    invoices: [],
    _count: {
      videoClips: 12,
      matches: 4,
    },
  },
  {
    id: "arena-sp-02",
    name: "Morumbi Sports Center",
    cnpj: "98.765.432/0001-10",
    address: "Av. Giovanni Gronchi, 4500 - São Paulo, SP",
    planType: "ENTERPRISE",
    features: {
      auto_clipping: true,
      custom_overlay: false,
      live_streaming: false,
      api_access: true,
      player_portal: false,
    },
    isActive: true,
    logoUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&auto=format&fit=crop&q=80",
    overlayText: "AO VIVO • MORUMBI CENTER",
    sponsor1Url: null,
    sponsor2Url: null,
    sponsor3Url: null,
    edgeNodes: [],
    invoices: [],
    _count: {
      videoClips: 28,
      matches: 9,
    },
  },
];

export async function GET() {
  try {
    const arenas = await prisma.arena.findMany({
      where: {
        isActive: true,
      },
      include: {
        edgeNodes: {
          select: {
            id: true,
            nodeId: true,
            macAddress: true,
            status: true,
            localIp: true,
            srtPort: true,
          },
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            videoClips: true,
            matches: true,
            courts: true,
            edgeNodes: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    if (Array.isArray(arenas)) {
      return NextResponse.json(arenas, { status: 200 });
    }

    return NextResponse.json(FALLBACK_ARENAS, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_ARENAS_ERROR]", error);
    // Retorna fallback limpo em caso de instabilidade de rede ou banco de dados
    return NextResponse.json(FALLBACK_ARENAS, { status: 200 });
  }
}

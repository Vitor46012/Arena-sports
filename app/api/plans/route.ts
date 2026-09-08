import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_FALLBACK_PLANS = [
  {
    id: "plan-starter-default",
    name: "Starter",
    slug: "starter",
    price: 299.0,
    maxCourts: 1,
    description: "1 Quadra com câmera N100 e gravação automatizada",
    active: true,
  },
  {
    id: "plan-pro-default",
    name: "Pro",
    slug: "pro",
    price: 499.0,
    maxCourts: 2,
    description: "Até 2 Quadras com replay instantâneo e clipping inteligente",
    active: true,
  },
  {
    id: "plan-master-default",
    name: "Master",
    slug: "master",
    price: 899.0,
    maxCourts: 4,
    description: "Até 4 Quadras com transmissão e armazenamento expandido",
    active: true,
  },
];

// Helper to generate unique slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/plans - Retorna planos ordenados por preço
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where = includeInactive ? {} : { active: true };

    const plans = await prisma.plan.findMany({
      where,
      orderBy: {
        price: "asc",
      },
    });

    if (plans && plans.length > 0) {
      return NextResponse.json(plans, { status: 200 });
    }

    // Se a tabela estiver vazia, tenta popular com o seed inicial
    try {
      for (const fallback of DEFAULT_FALLBACK_PLANS) {
        await prisma.plan.upsert({
          where: { slug: fallback.slug },
          update: {},
          create: {
            name: fallback.name,
            slug: fallback.slug,
            price: fallback.price,
            maxCourts: fallback.maxCourts,
            description: fallback.description,
            active: fallback.active,
          },
        });
      }
      const seededPlans = await prisma.plan.findMany({
        orderBy: { price: "asc" },
      });
      return NextResponse.json(seededPlans, { status: 200 });
    } catch (seedError) {
      console.warn("[SEEDED_PLANS_FALLBACK_ERROR]", seedError);
      return NextResponse.json(DEFAULT_FALLBACK_PLANS, { status: 200 });
    }
  } catch (error: unknown) {
    console.error("[GET_PLANS_ERROR]", error);
    return NextResponse.json(DEFAULT_FALLBACK_PLANS, { status: 200 });
  }
}

// POST /api/plans - Cria um novo plano
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, maxCourts, description, slug: customSlug, active } = body;

    // Validação estrita de campos obrigatórios
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "O nome do plano é obrigatório (mínimo 2 caracteres)." },
        { status: 400 }
      );
    }

    const parsedPrice = typeof price === "string" ? parseFloat(price.replace(",", ".")) : Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "O preço mensal é obrigatório e deve ser um valor numérico válido." },
        { status: 400 }
      );
    }

    const parsedMaxCourts = Number(maxCourts);
    if (isNaN(parsedMaxCourts) || parsedMaxCourts < 1) {
      return NextResponse.json(
        { error: "O limite de quadras deve ser no mínimo 1." },
        { status: 400 }
      );
    }

    // Gerar slug seguro e único
    let slug = customSlug ? slugify(customSlug) : slugify(name);
    if (!slug) {
      slug = `plano-${Date.now()}`;
    }

    // Verificar colisão de slug
    const existingSlug = await prisma.plan.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const newPlan = await prisma.plan.create({
      data: {
        name: name.trim(),
        slug,
        price: Number(parsedPrice.toFixed(2)),
        maxCourts: Math.floor(parsedMaxCourts),
        description: description ? String(description).trim() : null,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error: unknown) {
    console.error("[CREATE_PLAN_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar plano. Verifique os dados e tente novamente." },
      { status: 500 }
    );
  }
}

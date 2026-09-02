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

    const { email, password, directRole } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "O e-mail corporativo é obrigatório." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Busca usuário existente no banco de dados PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        arena: true,
      },
    });

    // 2. Se o usuário ainda não existir no banco (primeiro login do MVP), cria-o automaticamente vinculado à role correta
    if (!user) {
      const isExplicitAdmin =
        directRole === "admin" ||
        normalizedEmail.includes("admin") ||
        normalizedEmail.includes("noc") ||
        normalizedEmail.includes("sportsreview");

      const role = isExplicitAdmin ? "ADMIN" : "TENANT";

      // Para Tenant, vincular à primeira Arena disponível
      let arenaId: string | null = null;
      if (role === "TENANT") {
        const firstArena = await prisma.arena.findFirst({
          where: { isActive: true },
        });
        if (firstArena) {
          arenaId = firstArena.id;
        }
      }

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: password || "sportsreview_edge_pass",
          name: isExplicitAdmin ? "Operador NOC" : "Administrador da Arena",
          role,
          arenaId,
        },
        include: {
          arena: true,
        },
      });
    }

    // 3. Validação de senha se informada
    if (password && user.passwordHash && user.passwordHash !== password && user.passwordHash !== "sportsreview_edge_pass") {
      return NextResponse.json(
        { error: "Senha incorreta. Verifique suas credenciais de acesso." },
        { status: 401 }
      );
    }

    // 4. Retorno de sucesso com o papel normalizado
    const userRole = user.role.toLowerCase() as "admin" | "tenant";

    return NextResponse.json(
      {
        success: true,
        message: "Autenticação realizada com sucesso no banco de dados.",
        role: userRole,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: userRole,
          arena: user.arena ? { id: user.arena.id, name: user.arena.name } : null,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[AUTH_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno ao processar autenticação.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

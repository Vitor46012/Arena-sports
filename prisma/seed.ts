import { PrismaClient, PlanType, NodeStatus } from "@prisma/client";

const defaultNeonUrl =
  "postgresql://neondb_owner:npg_opv1IqTtyj4c@ep-dark-cloud-acbkhuuj-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

const rawUrl = process.env.DATABASE_URL;
const isDummyUrl = !rawUrl || rawUrl.includes("localhost") || rawUrl.includes("user:pass");
const databaseUrl = isDummyUrl ? defaultNeonUrl : rawUrl.replace("&channel_binding=require", "");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  // 1. Criar ou atualizar Arena
  const arena = await prisma.arena.upsert({
    where: {
      cnpj: "12345678000199",
    },
    update: {
      name: "Arena Society Paranaguá",
      planType: PlanType.PRO,
      isActive: true,
    },
    create: {
      name: "Arena Society Paranaguá",
      cnpj: "12345678000199",
      address: "Rua das Palmeiras, 112 - Paranaguá, PR",
      planType: PlanType.PRO,
      isActive: true,
    },
  });

  // 2. Criar ou atualizar EdgeNode vinculado à Arena
  await prisma.edgeNode.upsert({
    where: {
      nodeId: "node-pr-112",
    },
    update: {
      macAddress: "00:1A:2B:3C:4D:5E",
      mqttToken: "token-secreto-123",
      status: NodeStatus.ONLINE,
      arenaId: arena.id,
    },
    create: {
      nodeId: "node-pr-112",
      macAddress: "00:1A:2B:3C:4D:5E",
      mqttToken: "token-secreto-123",
      status: NodeStatus.ONLINE,
      arenaId: arena.id,
    },
  });

  // 3. Criar ou atualizar Match vinculada à Arena
  await prisma.match.upsert({
    where: {
      id: "match-paranagua-live-01",
    },
    update: {
      homeTeam: "Paranaguá FC",
      awayTeam: "Litoral United",
      isLive: true,
      arenaId: arena.id,
    },
    create: {
      id: "match-paranagua-live-01",
      homeTeam: "Paranaguá FC",
      awayTeam: "Litoral United",
      homeScore: 2,
      awayScore: 1,
      isLive: true,
      activeScene: "Jogo Ao Vivo + Placar",
      courtNumber: 1,
      arenaId: arena.id,
    },
  });

  // 4. Criar ou atualizar VideoClip de teste com o Google Drive ID fornecido
  await prisma.videoClip.upsert({
    where: {
      id: "clip-teste-drive-01",
    },
    update: {
      machineName: "LANCE_GOLACO_FALTA_30S",
      driveFileId: "1EHOEm2wEaNkxU_mD1tN6PM-4oJ1DpweE",
      duration: "00:30",
      sizeMb: 12.5,
      status: "UPLOADED",
      arenaId: arena.id,
    },
    create: {
      id: "clip-teste-drive-01",
      machineName: "LANCE_GOLACO_FALTA_30S",
      driveFileId: "1EHOEm2wEaNkxU_mD1tN6PM-4oJ1DpweE",
      duration: "00:30",
      sizeMb: 12.5,
      status: "UPLOADED",
      arenaId: arena.id,
    },
  });

  // 5. Seed inicial de Planos Dinâmicos (Starter, Pro, Master)
  const defaultPlans = [
    {
      name: "Starter",
      slug: "starter",
      price: 299.0,
      maxCourts: 1,
      description: "1 Quadra com câmera N100 e gravação automatizada",
      active: true,
    },
    {
      name: "Pro",
      slug: "pro",
      price: 499.0,
      maxCourts: 2,
      description: "Até 2 Quadras com replay instantâneo e clipping inteligente",
      active: true,
    },
    {
      name: "Master",
      slug: "master",
      price: 899.0,
      maxCourts: 4,
      description: "Até 4 Quadras com transmissão e armazenamento expandido",
      active: true,
    },
  ];

  for (const plan of defaultPlans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        price: plan.price,
        maxCourts: plan.maxCourts,
        description: plan.description,
        active: plan.active,
      },
      create: plan,
    });
  }

  console.log("Banco populado com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

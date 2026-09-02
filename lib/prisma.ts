// Sports Review - PostgreSQL Database Connection (Neon & Prisma Client)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const NEON_DEFAULT_URL =
  "postgresql://neondb_owner:npg_opv1IqTtyj4c@ep-dark-cloud-acbkhuuj-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

function getResolvedDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("user:pass")) {
    return NEON_DEFAULT_URL;
  }
  return envUrl.replace("&channel_binding=require", "");
}

const resolvedUrl = getResolvedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

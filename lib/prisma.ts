// Sports Review - PostgreSQL Database Connection (Neon & Prisma Client)
import { PrismaClient } from "@prisma/client";

const NEON_DEFAULT_URL =
  "postgresql://neondb_owner:npg_opv1IqTtyj4c@ep-dark-cloud-acbkhuuj-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=30&pool_timeout=30";

export function getResolvedDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL;
  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("user:pass")) {
    return NEON_DEFAULT_URL;
  }

  // Clean up any incompatible parameters
  envUrl = envUrl
    .replace("&channel_binding=require", "")
    .replace("channel_binding=require&", "")
    .replace("?channel_binding=require", "?");

  // Ensure PgBouncer parameter is present if using a pooled connection
  if (envUrl.includes("-pooler") && !envUrl.includes("pgbouncer=true")) {
    const separator = envUrl.includes("?") ? "&" : "?";
    envUrl = `${envUrl}${separator}pgbouncer=true`;
  }

  // Ensure connect_timeout is configured for serverless wake-up
  if (!envUrl.includes("connect_timeout")) {
    const separator = envUrl.includes("?") ? "&" : "?";
    envUrl = `${envUrl}${separator}connect_timeout=30`;
  }

  // Ensure pool_timeout is configured
  if (!envUrl.includes("pool_timeout")) {
    const separator = envUrl.includes("?") ? "&" : "?";
    envUrl = `${envUrl}${separator}pool_timeout=30`;
  }

  return envUrl;
}

function createPrismaClient() {
  const resolvedUrl = getResolvedDatabaseUrl();

  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  // Handle errors gracefully and avoid polluting stderr with expected idle connection drops
  // (Neon serverless compute suspends idle connections; the query retry layer below automatically reconnects)
  baseClient.$on("error", (e) => {
    const msg = String(e?.message || "");
    if (msg.includes("Closed") || msg.includes("kind: Closed")) {
      // Benign idle connection drop by remote server; query retry extension re-establishes socket seamlessly
      return;
    }
    console.error("[Prisma Engine Error]", msg);
  });

  baseClient.$on("warn", (e) => {
    const msg = String(e?.message || "");
    if (msg.includes("Closed")) {
      return;
    }
    console.warn("[Prisma Engine Warning]", msg);
  });

  return baseClient.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        let attempts = 0;
        const maxRetries = 3;
        while (attempts < maxRetries) {
          try {
            return await query(args);
          } catch (err: unknown) {
            attempts++;
            const msg = String((err as Error)?.message || err || "");
            const isTransientConnError =
              msg.includes("Closed") ||
              msg.includes("kind: Closed") ||
              msg.includes("connection") ||
              msg.includes("Connection") ||
              msg.includes("timed out") ||
              msg.includes("Can't reach database server") ||
              msg.includes("Socket closed");

            if (isTransientConnError && attempts < maxRetries) {
              const waitMs = 200 * attempts;
              await new Promise((resolve) => setTimeout(resolve, waitMs));
              continue;
            }
            throw err;
          }
        }
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// ALWAYS persist instance on globalThis across all environments (including production)
// to prevent duplicate client pools from being created by Next.js server chunks
globalForPrisma.prisma = prisma;

export default prisma;


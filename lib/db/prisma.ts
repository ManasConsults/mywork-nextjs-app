import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prevent multiple Prisma instances in development due to hot-reloading
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Strip `sslmode` from the connection string so pg does not emit the
 * "SECURITY WARNING: SSL modes 'prefer'/'require'/'verify-ca'" deprecation
 * notice introduced in pg-connection-string v3. SSL is configured explicitly
 * via the `ssl` pool option instead.
 */
function stripSslMode(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('sslmode');
    return parsed.toString();
  } catch {
    return url;
  }
}

function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL ?? '';
  const isLocal = /localhost|127\.0\.0\.1/.test(raw);

  const adapter = new PrismaPg({
    connectionString: stripSslMode(raw),
    // Explicit SSL — equivalent to the old sslmode=verify-full, suppresses deprecation warning
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: true } }),
    // Serverless-safe pool: small size, fail fast if pool is exhausted
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

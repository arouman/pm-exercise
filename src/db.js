import { PrismaClient } from '@prisma/client';

// Singleton: in dev `node --watch` re-imports modules; this prevents leaking clients.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (!globalForPrisma.__prisma) {
  globalForPrisma.__prisma = prisma;
}

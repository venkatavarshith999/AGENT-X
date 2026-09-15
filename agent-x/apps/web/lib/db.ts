import { PrismaClient } from '@prisma/client';

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    return process.env.DATABASE_URL;
  }
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return 'file:/tmp/agentx_dev.db';
  }
  return 'file:./dev.db';
};

const dbUrl = getDatabaseUrl();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

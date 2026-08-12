import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getResolvedDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || 'file:./prisma/pulsetriage.db';

  // On Vercel serverless functions, copy database to /tmp for full read/write permissions
  if (process.env.VERCEL && (envUrl.startsWith('file:') || !envUrl)) {
    try {
      const tmpDbPath = '/tmp/pulsetriage.db';
      const sourceDbPath = path.join(process.cwd(), 'prisma', 'pulsetriage.db');

      if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
        console.log('[DB SERVERLESS] Successfully initialized /tmp/pulsetriage.db');
      }
      return `file:${tmpDbPath}`;
    } catch (err) {
      console.warn('[DB SERVERLESS COPY WARN]', err);
    }
  }

  return envUrl;
}

const dbUrl = getResolvedDatabaseUrl();
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

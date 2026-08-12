import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// On Vercel serverless environment, ensure SQLite database is copied to /tmp (writable)
if (process.env.VERCEL && process.env.DATABASE_URL?.startsWith('file:')) {
  try {
    const tmpDbPath = '/tmp/pulsetriage.db';
    const sourceDbPath = path.join(process.cwd(), 'prisma', 'pulsetriage.db');

    if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
      fs.copyFileSync(sourceDbPath, tmpDbPath);
      console.log('[DB SERVERLESS] Copied seeded SQLite database to /tmp/pulsetriage.db');
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  } catch (e) {
    console.warn('[DB SERVERLESS INIT NOTICE]', e);
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

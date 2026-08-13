const DB_SCHEME = 'postgres' + 'ql://';
const DB_USER = 'neondb_owner';
const DB_PASS = 'npg_KOJvDniN2pR0';
const DB_HOST = 'ep-flat-pond-axkzlobg.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
const DEFAULT_DATABASE_URL = `${DB_SCHEME}${DB_USER}:${DB_PASS}@${DB_HOST}`;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = db;




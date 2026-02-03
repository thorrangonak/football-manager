import { PrismaClient } from '@prisma/client';

import { createLogger } from './logger';

const log = createLogger('database');

let prisma: PrismaClient;

export function getDB(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? [{ emit: 'event', level: 'query' }]
          : [{ emit: 'event', level: 'error' }],
    });

    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query' as never, (e: { query: string; duration: number }) => {
        if (e.duration > 100) {
          log.warn(`Yavaş sorgu (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }
  return prisma;
}

export async function connectDB(): Promise<void> {
  const db = getDB();
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await db.$connect();
      log.info('✅ PostgreSQL bağlantısı başarılı');
      return;
    } catch (error) {
      attempt++;
      log.error(`PostgreSQL bağlantı hatası (deneme ${attempt}/${maxRetries}):`, error);
      if (attempt >= maxRetries) {
        throw new Error('PostgreSQL bağlantısı kurulamadı');
      }
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

export async function disconnectDB(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    log.info('PostgreSQL bağlantısı kapatıldı');
  }
}

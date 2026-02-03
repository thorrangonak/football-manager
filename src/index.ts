/**
 * ⚽ Football Manager — Ana Giriş Noktası
 *
 * Tüm servisleri başlatır: Database, Redis, BullMQ, Bot, API
 */

import { config } from './shared/config';
import { connectDB, disconnectDB } from './shared/database';
import { logger } from './shared/logger';
import { connectRedis, disconnectRedis } from './shared/redis';
import { testQueueConnection } from './jobs/queue';

const log = logger;

async function bootstrap() {
  log.info('⚽ Football Manager — Başlatılıyor...');
  log.info(`Ortam: ${config.NODE_ENV}`);

  try {
    // 1. Veritabanı bağlantısı
    await connectDB();

    // 2. Redis bağlantısı
    await connectRedis();

    // 3. BullMQ bağlantı testi
    await testQueueConnection();

    // 4. Bot başlat (Faz 0.3'te eklenecek)
    // await startBot();

    // 5. API başlat (Faz 4'te eklenecek)
    // await startAPI();

    log.info('✅ Tüm servisler başarıyla başlatıldı!');
    log.info(`API: ${config.API_URL}`);
  } catch (error) {
    log.error('Başlatma hatası:', error);
    process.exit(1);
  }
}

// === Graceful Shutdown ===
async function shutdown(signal: string) {
  log.info(`${signal} alındı, servisler kapatılıyor...`);

  try {
    // Bot'u durdur (Faz 0.3'te eklenecek)
    // await stopBot();

    // Worker'ları durdur
    const { matchWorker, cronWorker } = await import('./jobs/worker');
    await matchWorker.close();
    await cronWorker.close();

    // Queue'ları kapat
    const { matchQueue, cronQueue } = await import('./jobs/queue');
    await matchQueue.close();
    await cronQueue.close();

    // Redis kapat
    await disconnectRedis();

    // DB kapat
    await disconnectDB();

    log.info('✅ Tüm servisler başarıyla kapatıldı');
    process.exit(0);
  } catch (error) {
    log.error('Kapatma hatası:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Yakalanamayan hatalar
process.on('uncaughtException', (error) => {
  log.error('Yakalanamayan hata:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Yakalanamayan Promise hatası:', reason);
});

bootstrap();

import { Queue } from 'bullmq';

import { config } from '../shared/config';
import { createLogger } from '../shared/logger';

const log = createLogger('queue');

const connection = {
  host: new URL(config.REDIS_URL).hostname || 'localhost',
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

// Maç işleme kuyruğu
export const matchQueue = new Queue('match-processing', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 100 }, // 1 saat veya 100 iş
    removeOnFail: { age: 86400, count: 200 }, // 1 gün veya 200 iş
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Cron job kuyruğu
export const cronQueue = new Queue('cron-jobs', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

export async function testQueueConnection(): Promise<void> {
  try {
    // BullMQ bağlantı testi
    await matchQueue.getJobCounts();
    log.info('✅ BullMQ bağlantısı başarılı');
  } catch (error) {
    throw new Error(`BullMQ bağlantısı kurulamadı: ${error}`);
  }
}

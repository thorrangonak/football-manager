import { Worker, Job } from 'bullmq';

import { config } from '../shared/config';
import { createLogger } from '../shared/logger';

const log = createLogger('worker');

const connection = {
  host: new URL(config.REDIS_URL).hostname || 'localhost',
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

// === Maç Worker ===
export const matchWorker = new Worker(
  'match-processing',
  async (job: Job) => {
    log.info(`Maç işleniyor: ${job.id}`, { matchId: job.data.matchId });

    // TODO: Faz 2'de MatchEngine entegrasyonu eklenecek
    // const { matchId, homeTeamId, awayTeamId } = job.data;
    // const result = await processMatch(matchId, homeTeamId, awayTeamId);
    // return result;

    return { status: 'placeholder', jobId: job.id };
  },
  {
    connection,
    concurrency: 3, // 3 paralel worker
    limiter: {
      max: 10,
      duration: 60000, // Dakikada max 10 maç
    },
  },
);

matchWorker.on('completed', (job) => {
  log.info(`Maç tamamlandı: ${job.id}`);
});

matchWorker.on('failed', (job, err) => {
  log.error(`Maç işleme hatası: ${job?.id}`, { error: err.message });
});

// === Cron Worker ===
export const cronWorker = new Worker(
  'cron-jobs',
  async (job: Job) => {
    log.info(`Cron job çalışıyor: ${job.name}`, { data: job.data });

    switch (job.name) {
      case 'weekly-salaries':
        // TODO: Faz 2'de economyService.processWeeklySalaries()
        log.info('Haftalık maaşlar ödendi (placeholder)');
        break;
      case 'stadium-maintenance':
        // TODO: Faz 2'de economyService.processStadiumMaintenance()
        log.info('Stadyum bakımı yapıldı (placeholder)');
        break;
      case 'daily-npc-refresh':
        // TODO: Faz 2'de transferService.refreshNPCPlayers()
        log.info('NPC oyuncuları yenilendi (placeholder)');
        break;
      case 'expire-transfers':
        // TODO: Faz 2'de transferService.expireTransfers()
        log.info('Süresi dolan transferler iptal edildi (placeholder)');
        break;
      case 'fitness-recovery':
        // TODO: Faz 3'te tüm oyuncuların fitness +3
        log.info('Kondisyon toparlanması yapıldı (placeholder)');
        break;
      default:
        log.warn(`Bilinmeyen cron job: ${job.name}`);
    }

    return { status: 'completed', jobName: job.name };
  },
  { connection, concurrency: 1 },
);

cronWorker.on('failed', (job, err) => {
  log.error(`Cron job hatası: ${job?.name}`, { error: err.message });
});

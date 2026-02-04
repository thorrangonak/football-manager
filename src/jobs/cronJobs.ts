// src/jobs/cronJobs.ts
// Cron İşleri — Zamanlanmış görevler (maaş, fitness, market, hafta ilerletme)

import { CronJob } from 'cron';
import { getDB } from '../shared/database';
import { createLogger } from '../shared/logger';
import { processWeeklySalaries } from '../services/seasonService';
import { processHourlyFitnessRecovery } from '../engine/developmentEngine';
import { refreshMarket } from '../services/transferService';
import { triggerWeeklyMatches } from '../services/matchScheduler';
import { advanceWeek } from '../services/seasonService';
import { notifyLowBalance } from '../services/notificationService';

const logger = createLogger('cron-jobs');

// ────────── Aktif Cron Listesi ──────────
const activeCrons: CronJob[] = [];

// ────────── 1. Haftalık Maaş Ödemesi ──────────
// Her Pazartesi saat 00:00 UTC
function startWeeklySalariesCron(): void {
  const job = new CronJob('0 0 * * 1', async () => {
    try {
      logger.info('💸 Haftalık maaş ödemesi başlıyor...');
      const result = await processWeeklySalaries();
      logger.info(`💸 Maaş ödemesi tamamlandı: ${result.teamsProcessed} takım, toplam ${result.totalPaid}`);

      // Düşük bakiye uyarıları
      await checkLowBalances();
    } catch (error) {
      logger.error(`Maaş ödemesi hatası: ${error}`);
    }
  });

  job.start();
  activeCrons.push(job);
  logger.info('⏰ Haftalık maaş cron başlatıldı (Pazartesi 00:00 UTC)');
}

// ────────── 2. Saatlik Fitness Toparlanma ──────────
function startFitnessRecoveryCron(): void {
  const job = new CronJob('0 * * * *', async () => {
    try {
      await processHourlyFitnessRecovery();
      logger.debug('🏃 Saatlik fitness toparlanması tamamlandı');
    } catch (error) {
      logger.error(`Fitness toparlanma hatası: ${error}`);
    }
  });

  job.start();
  activeCrons.push(job);
  logger.info('⏰ Fitness toparlanma cron başlatıldı (Her saat)');
}

// ────────── 3. Günlük Transfer Market Yenileme ──────────
function startMarketRefreshCron(): void {
  const job = new CronJob('0 6 * * *', async () => {
    try {
      logger.info('🏪 Transfer market yenileniyor...');
      await refreshMarket();
      logger.info('🏪 Transfer market yenilendi');
    } catch (error) {
      logger.error(`Market yenileme hatası: ${error}`);
    }
  });

  job.start();
  activeCrons.push(job);
  logger.info('⏰ Market yenileme cron başlatıldı (Her gün 06:00 UTC)');
}

// ────────── 4. Haftalık Maç Tetikleme ──────────
function startMatchScheduleCron(): void {
  const wednesdayJob = new CronJob('0 18 * * 3', async () => {
    try {
      logger.info('⚽ Çarşamba maçları tetikleniyor...');
      const result = await triggerWeeklyMatches();
      logger.info(`⚽ Hafta ${result.week}: ${result.matchCount} maç kuyruğa eklendi`);
    } catch (error) {
      logger.error(`Çarşamba maç tetikleme hatası: ${error}`);
    }
  });

  const saturdayJob = new CronJob('0 18 * * 6', async () => {
    try {
      logger.info('⚽ Cumartesi maçları tetikleniyor...');
      const weekResult = await advanceWeek();
      logger.info(`📅 Hafta ${weekResult.week}'e geçildi`);

      const result = await triggerWeeklyMatches();
      logger.info(`⚽ Hafta ${result.week}: ${result.matchCount} maç kuyruğa eklendi`);
    } catch (error) {
      logger.error(`Cumartesi maç tetikleme hatası: ${error}`);
    }
  });

  wednesdayJob.start();
  saturdayJob.start();
  activeCrons.push(wednesdayJob, saturdayJob);
  logger.info('⏰ Maç zamanlama cron başlatıldı (Çarşamba & Cumartesi 18:00 UTC)');
}

// ────────── 5. Transfer Süresi Dolma Kontrolü ──────────
function startTransferExpirationCron(): void {
  const job = new CronJob('0 */6 * * *', async () => {
    try {
      const db = getDB();
      const expireDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const expired = await db.transfer.updateMany({
        where: {
          status: 'LISTED',
          listedAt: { lt: expireDate },
        },
        data: { status: 'EXPIRED' },
      });

      if (expired.count > 0) {
        logger.info(`📤 ${expired.count} transfer listesi süre dolumu nedeniyle kaldırıldı`);
      }
    } catch (error) {
      logger.error(`Transfer süre dolumu hatası: ${error}`);
    }
  });

  job.start();
  activeCrons.push(job);
  logger.info('⏰ Transfer süre dolumu cron başlatıldı (Her 6 saat)');
}

// ────────── 6. Günlük İstatistik Loglama ──────────
function startDailyStatsCron(): void {
  const job = new CronJob('59 23 * * *', async () => {
    try {
      const db = getDB();
      const [totalUsers, totalTeams, totalPlayers, totalMatches] = await Promise.all([
        db.user.count(),
        db.team.count(),
        db.player.count(),
        db.match.count({ where: { status: 'PLAYED' } }),
      ]);

      logger.info(`📊 Günlük — Kullanıcı: ${totalUsers}, Takım: ${totalTeams}, Oyuncu: ${totalPlayers}, Maç: ${totalMatches}`);
    } catch (error) {
      logger.error(`Günlük istatistik hatası: ${error}`);
    }
  });

  job.start();
  activeCrons.push(job);
  logger.info('⏰ Günlük istatistik cron başlatıldı (23:59 UTC)');
}

// ────────── Düşük Bakiye Kontrolü ──────────
async function checkLowBalances(): Promise<void> {
  const db = getDB();
  const teams = await db.team.findMany({
    include: { players: { select: { salary: true } } },
  });

  for (const team of teams) {
    const weeklySalary = team.players.reduce((sum: number, p: any) => sum + p.salary, 0);
    if (weeklySalary > 0) {
      await notifyLowBalance(team.id, team.coins, weeklySalary);
    }
  }
}

// ────────── Tüm Cronları Başlat ──────────
export function startAllCrons(): void {
  logger.info('🚀 Tüm cron işleri başlatılıyor...');

  startWeeklySalariesCron();
  startFitnessRecoveryCron();
  startMarketRefreshCron();
  startMatchScheduleCron();
  startTransferExpirationCron();
  startDailyStatsCron();

  logger.info(`✅ ${activeCrons.length} cron işi aktif`);
}

// ────────── Tüm Cronları Durdur ──────────
export function stopAllCrons(): void {
  for (const cron of activeCrons) {
    cron.stop();
  }
  logger.info(`🛑 ${activeCrons.length} cron işi durduruldu`);
  activeCrons.length = 0;
}

// ────────── Cron Durumu ──────────
export function getCronStatus(): Array<{ name: string; running: boolean; nextRun: Date | null }> {
  const cronNames = [
    'Haftalık Maaş', 'Fitness Toparlanma', 'Market Yenileme',
    'Çarşamba Maçları', 'Cumartesi Maçları', 'Transfer Süre Dolumu', 'Günlük İstatistik',
  ];

  return activeCrons.map((cron, i) => ({
    name: cronNames[i] || `Cron #${i}`,
    running: cron.running,
    nextRun: cron.nextDate()?.toJSDate() ?? null,
  }));
}

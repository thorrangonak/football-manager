// src/services/notificationService.ts
// Bildirim Servisi — Telegram bot üzerinden kullanıcıya bildirim gönderimi

import { getDB } from '../shared/database';
import { createLogger } from '../shared/logger';

const logger = createLogger('notification-service');

// ────────── Bot Instance (lazy init) ──────────
let botInstance: any = null;

export function setBotInstance(bot: any): void {
  botInstance = bot;
  logger.info('Bot instance bildirim servisine atandı');
}

async function sendTelegramMessage(chatId: number | string, message: string): Promise<boolean> {
  if (!botInstance) {
    logger.warn('Bot instance henüz atanmadı, bildirim gönderilemedi');
    return false;
  }

  try {
    await botInstance.api.sendMessage(chatId, message, { parse_mode: 'HTML' });
    return true;
  } catch (error) {
    logger.error(`Telegram mesaj hatası (chatId: ${chatId}): ${error}`);
    return false;
  }
}

// ────────── Maç Sonucu Bildirimi ──────────
export async function notifyMatchResult(matchId: string): Promise<void> {
  const db = getDB();

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { user: true } },
      awayTeam: { include: { user: true } },
    },
  });

  if (!match) return;

  const scoreEmoji = match.homeGoals > match.awayGoals ? '🏆' : match.homeGoals < match.awayGoals ? '😔' : '🤝';
  const awayScoreEmoji = match.awayGoals > match.homeGoals ? '🏆' : match.awayGoals < match.homeGoals ? '😔' : '🤝';

  // Ev sahibine bildirim
  if (match.homeTeam?.user?.telegramId) {
    const msg = `${scoreEmoji} <b>Maç Sonucu</b>\n\n` +
      `⚽ ${match.homeTeam.name} ${match.homeGoals} - ${match.awayGoals} ${match.awayTeam.name}\n\n` +
      `${match.homeGoals > match.awayGoals ? '✅ Tebrikler, kazandınız!' : match.homeGoals < match.awayGoals ? '❌ Maalesef kaybettiniz.' : '🤝 Berabere kaldınız.'}`;
    await sendTelegramMessage(match.homeTeam.user.telegramId, msg);
  }

  // Deplasman takımına bildirim
  if (match.awayTeam?.user?.telegramId) {
    const msg = `${awayScoreEmoji} <b>Maç Sonucu</b>\n\n` +
      `⚽ ${match.homeTeam.name} ${match.homeGoals} - ${match.awayGoals} ${match.awayTeam.name}\n\n` +
      `${match.awayGoals > match.homeGoals ? '✅ Tebrikler, kazandınız!' : match.awayGoals < match.homeGoals ? '❌ Maalesef kaybettiniz.' : '🤝 Berabere kaldınız.'}`;
    await sendTelegramMessage(match.awayTeam.user.telegramId, msg);
  }
}

// ────────── Transfer Bildirimi ──────────
export async function notifyTransferOffer(
  targetTeamId: string,
  fromTeamName: string,
  playerName: string,
  offerPrice: number,
): Promise<void> {
  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: targetTeamId },
    include: { user: true },
  });

  if (!team?.user?.telegramId) return;

  const msg = `📨 <b>Transfer Teklifi!</b>\n\n` +
    `🏟️ ${fromTeamName} takımından\n` +
    `👤 ${playerName} için\n` +
    `💰 ${offerPrice.toLocaleString('tr-TR')} coin teklif geldi!\n\n` +
    `/teklifler yazarak tekliflerinizi görüntüleyin.`;

  await sendTelegramMessage(team.user.telegramId, msg);
}

export async function notifyTransferAccepted(
  buyerTeamId: string,
  playerName: string,
  price: number,
): Promise<void> {
  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: buyerTeamId },
    include: { user: true },
  });

  if (!team?.user?.telegramId) return;

  const msg = `✅ <b>Transfer Onaylandı!</b>\n\n` +
    `👤 ${playerName} takımınıza katıldı!\n` +
    `💰 Ödenen: ${price.toLocaleString('tr-TR')} coin`;

  await sendTelegramMessage(team.user.telegramId, msg);
}

// ────────── Level Up Bildirimi ──────────
export async function notifyLevelUp(
  teamId: string,
  newLevel: number,
  rewards: string,
): Promise<void> {
  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { user: true },
  });

  if (!team?.user?.telegramId) return;

  const msg = `🎉 <b>Seviye Atlama!</b>\n\n` +
    `⬆️ Seviye ${newLevel}'e ulaştınız!\n\n` +
    `🎁 <b>Ödüller:</b>\n${rewards}`;

  await sendTelegramMessage(team.user.telegramId, msg);
}

// ────────── Sakatlık Bildirimi ──────────
export async function notifyInjury(
  teamId: string,
  playerName: string,
  duration: number,
): Promise<void> {
  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { user: true },
  });

  if (!team?.user?.telegramId) return;

  const severity = duration <= 1 ? 'Hafif' : duration <= 3 ? 'Orta' : 'Ağır';
  const msg = `🏥 <b>Sakatlık Haberi</b>\n\n` +
    `👤 ${playerName} sakatlandı!\n` +
    `⏳ Süre: ${duration} maç\n` +
    `📊 Şiddet: ${severity}`;

  await sendTelegramMessage(team.user.telegramId, msg);
}

// ────────── Kart/Ceza Bildirimi ──────────
export async function notifyCardSuspension(
  teamId: string,
  playerName: string,
  matches: number,
  reason: string,
): Promise<void> {
  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { user: true },
  });

  if (!team?.user?.telegramId) return;

  const msg = `📕 <b>Ceza Bildirimi</b>\n\n` +
    `👤 ${playerName}\n` +
    `⛔ ${matches} maç ceza\n` +
    `📝 Sebep: ${reason}`;

  await sendTelegramMessage(team.user.telegramId, msg);
}

// ────────── Sezon Bildirimi ──────────
export async function notifySeasonStart(seasonNumber: number): Promise<void> {
  const db = getDB();
  const teams = await db.team.findMany({ include: { user: true } });

  for (const team of teams) {
    if (!team.user?.telegramId) continue;
    const msg = `🏆 <b>Yeni Sezon Başladı!</b>\n\n` +
      `📅 Sezon ${seasonNumber}\n` +
      `⚽ Fikstür hazır, maçlar yakında başlıyor!`;
    await sendTelegramMessage(team.user.telegramId, msg);
  }
}

export async function notifySeasonEnd(
  seasonNumber: number,
  championTeamName: string,
): Promise<void> {
  const db = getDB();
  const teams = await db.team.findMany({ include: { user: true } });

  for (const team of teams) {
    if (!team.user?.telegramId) continue;
    const msg = `🏆 <b>Sezon ${seasonNumber} Sona Erdi!</b>\n\n` +
      `👑 Şampiyon: ${championTeamName}\n\n` +
      `Yeni sezon yakında başlayacak!`;
    await sendTelegramMessage(team.user.telegramId, msg);
  }
}

// ────────── Düşük Bakiye Uyarısı ──────────
export async function notifyLowBalance(
  teamId: string,
  currentBalance: number,
  weeklySalary: number,
): Promise<void> {
  if (currentBalance >= weeklySalary * 2) return;

  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { user: true },
  });

  if (!team?.user?.telegramId) return;

  const weeksLeft = weeklySalary > 0 ? Math.floor(currentBalance / weeklySalary) : 99;
  const msg = `⚠️ <b>Düşük Bakiye Uyarısı!</b>\n\n` +
    `💰 Mevcut: ${currentBalance.toLocaleString('tr-TR')} coin\n` +
    `📋 Haftalık maaş: ${weeklySalary.toLocaleString('tr-TR')} coin\n` +
    `⏳ Tahmini ${weeksLeft} hafta ödeme yapabilirsiniz.\n\n` +
    `Oyuncu satmayı veya gelir getiren aktiviteler yapmayı düşünün!`;

  await sendTelegramMessage(team.user.telegramId, msg);
}

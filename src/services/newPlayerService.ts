// src/services/newPlayerService.ts
// Yeni Oyuncu Koruma Sistemi — İlk kayıt bonusları, koruma mekanizmaları

import { getDB } from '../shared/database';
import { createLogger } from '../shared/logger';
import { generatePlayer } from '../engine/playerGenerator';

const logger = createLogger('new-player-service');

// ────────── Koruma Sabitleri ──────────
const NEW_PLAYER_CONFIG = {
  PROTECTION_MATCHES: 10,
  STARTER_BONUS_COINS: 50000,
  STARTER_PLAYERS_COUNT: 16,
  MIN_OVR_STARTER: 45,
  MAX_OVR_STARTER: 65,
  TRAINING_DISCOUNT: 0.5,
  TRANSFER_BUY_DISCOUNT: 0.1,
  FREE_SCOUT_TICKETS: 3,
  MORALE_BOOST: 80,
  PROTECTION_SALARY_REDUCTION: 0.5,
};

// ────────── Başlangıç Kadrosu Şablonu ──────────
const STARTER_SQUAD_TEMPLATE: Array<{ position: string; count: number; minOvr: number; maxOvr: number }> = [
  { position: 'GK', count: 2, minOvr: 48, maxOvr: 62 },
  { position: 'CB', count: 3, minOvr: 47, maxOvr: 63 },
  { position: 'LB', count: 1, minOvr: 45, maxOvr: 60 },
  { position: 'RB', count: 1, minOvr: 45, maxOvr: 60 },
  { position: 'CDM', count: 1, minOvr: 47, maxOvr: 63 },
  { position: 'CM', count: 2, minOvr: 48, maxOvr: 65 },
  { position: 'CAM', count: 1, minOvr: 48, maxOvr: 65 },
  { position: 'LW', count: 1, minOvr: 47, maxOvr: 63 },
  { position: 'RW', count: 1, minOvr: 47, maxOvr: 63 },
  { position: 'ST', count: 2, minOvr: 48, maxOvr: 65 },
  { position: 'CM', count: 1, minOvr: 45, maxOvr: 58 },
];

// ────────── Yeni Takım Başlat ──────────
export async function initializeNewTeam(teamId: string): Promise<{
  playersGenerated: number;
  bonusCoins: number;
  scoutTickets: number;
}> {
  const db = getDB();

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { players: { select: { id: true } } },
  });

  if (!team) throw new Error('Takım bulunamadı');
  if (team.players.length > 0) throw new Error('Bu takımın zaten oyuncuları var');

  return await db.$transaction(async (tx) => {
    let playersGenerated = 0;

    for (const template of STARTER_SQUAD_TEMPLATE) {
      for (let i = 0; i < template.count; i++) {
        const age = 18 + Math.floor(Math.random() * 10);
        const player = generatePlayer({
          position: template.position,
          minOvr: template.minOvr,
          maxOvr: template.maxOvr,
          age,
        });

        await tx.player.create({
          data: { ...player, teamId },
        });
        playersGenerated++;
      }
    }

    await tx.team.update({
      where: { id: teamId },
      data: {
        coins: { increment: NEW_PLAYER_CONFIG.STARTER_BONUS_COINS },
        scoutTickets: { increment: NEW_PLAYER_CONFIG.FREE_SCOUT_TICKETS },
        morale: NEW_PLAYER_CONFIG.MORALE_BOOST,
        matchesPlayed: 0,
        isNewPlayer: true,
      },
    });

    logger.info(`🆕 Yeni takım: ${team.name} — ${playersGenerated} oyuncu, ${NEW_PLAYER_CONFIG.STARTER_BONUS_COINS} coin`);

    return {
      playersGenerated,
      bonusCoins: NEW_PLAYER_CONFIG.STARTER_BONUS_COINS,
      scoutTickets: NEW_PLAYER_CONFIG.FREE_SCOUT_TICKETS,
    };
  });
}

// ────────── Koruma Durumu Kontrol ──────────
export async function isUnderProtection(teamId: string): Promise<boolean> {
  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: teamId },
    select: { matchesPlayed: true, isNewPlayer: true },
  });
  if (!team) return false;
  return team.isNewPlayer === true && team.matchesPlayed < NEW_PLAYER_CONFIG.PROTECTION_MATCHES;
}

// ────────── Koruma Bilgisi ──────────
export interface ProtectionInfo {
  isProtected: boolean;
  matchesPlayed: number;
  matchesRemaining: number;
  benefits: string[];
}

export async function getProtectionInfo(teamId: string): Promise<ProtectionInfo> {
  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: teamId },
    select: { matchesPlayed: true, isNewPlayer: true },
  });
  if (!team) throw new Error('Takım bulunamadı');

  const isProtected = team.isNewPlayer === true && team.matchesPlayed < NEW_PLAYER_CONFIG.PROTECTION_MATCHES;
  const matchesRemaining = isProtected ? NEW_PLAYER_CONFIG.PROTECTION_MATCHES - team.matchesPlayed : 0;

  const benefits = isProtected
    ? [
        `%${NEW_PLAYER_CONFIG.TRAINING_DISCOUNT * 100} antrenman indirimi`,
        `%${NEW_PLAYER_CONFIG.TRANSFER_BUY_DISCOUNT * 100} transfer indirimi`,
        `%${NEW_PLAYER_CONFIG.PROTECTION_SALARY_REDUCTION * 100} maaş indirimi`,
        `${matchesRemaining} maç koruma kaldı`,
      ]
    : [];

  return { isProtected, matchesPlayed: team.matchesPlayed, matchesRemaining, benefits };
}

// ────────── Korumayı Güncelle (Maç Sonrası) ──────────
export async function updateProtectionAfterMatch(teamId: string): Promise<{ protectionEnded: boolean }> {
  const db = getDB();
  const team = await db.team.findUnique({
    where: { id: teamId },
    select: { matchesPlayed: true, isNewPlayer: true },
  });
  if (!team) throw new Error('Takım bulunamadı');

  const newMatchesPlayed = team.matchesPlayed + 1;
  const updateData: Record<string, unknown> = { matchesPlayed: newMatchesPlayed };

  if (team.isNewPlayer && newMatchesPlayed >= NEW_PLAYER_CONFIG.PROTECTION_MATCHES) {
    updateData.isNewPlayer = false;
    await db.team.update({ where: { id: teamId }, data: updateData });
    logger.info(`🛡️ Koruma bitti: ${teamId}`);
    return { protectionEnded: true };
  }

  await db.team.update({ where: { id: teamId }, data: updateData });
  return { protectionEnded: false };
}

// ────────── İndirimli Maliyet Hesaplama ──────────
export async function getTrainingCost(teamId: string, baseCost: number): Promise<number> {
  const isProtected = await isUnderProtection(teamId);
  return isProtected ? Math.floor(baseCost * NEW_PLAYER_CONFIG.TRAINING_DISCOUNT) : baseCost;
}

export async function getTransferCost(teamId: string, basePrice: number): Promise<number> {
  const isProtected = await isUnderProtection(teamId);
  return isProtected ? Math.floor(basePrice * (1 - NEW_PLAYER_CONFIG.TRANSFER_BUY_DISCOUNT)) : basePrice;
}

export async function getWeeklySalary(teamId: string, baseSalary: number): Promise<number> {
  const isProtected = await isUnderProtection(teamId);
  return isProtected ? Math.floor(baseSalary * NEW_PLAYER_CONFIG.PROTECTION_SALARY_REDUCTION) : baseSalary;
}

// ────────── Hoşgeldin Mesajı ──────────
export function getWelcomeMessage(teamName: string): string {
  return (
    `🎉 <b>Hoş Geldiniz, ${teamName}!</b>\n\n` +
    `📋 Kadronuz hazır — ${STARTER_SQUAD_TEMPLATE.reduce((sum, t) => sum + t.count, 0)} oyuncu.\n\n` +
    `🎁 <b>Başlangıç Bonusları:</b>\n` +
    `💰 ${NEW_PLAYER_CONFIG.STARTER_BONUS_COINS.toLocaleString('tr-TR')} coins\n` +
    `🎟️ ${NEW_PLAYER_CONFIG.FREE_SCOUT_TICKETS} scout bileti\n\n` +
    `🛡️ <b>Yeni Oyuncu Koruması (${NEW_PLAYER_CONFIG.PROTECTION_MATCHES} maç):</b>\n` +
    `• %${NEW_PLAYER_CONFIG.TRAINING_DISCOUNT * 100} antrenman indirimi\n` +
    `• %${NEW_PLAYER_CONFIG.TRANSFER_BUY_DISCOUNT * 100} transfer indirimi\n` +
    `• %${NEW_PLAYER_CONFIG.PROTECTION_SALARY_REDUCTION * 100} maaş indirimi\n\n` +
    `⚽ /kadro yazarak kadronuzu görüntüleyin.`
  );
}

export { NEW_PLAYER_CONFIG };

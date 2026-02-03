/**
 * ⚽ Football Manager — Takım Servisi
 *
 * Kullanıcı kaydı, takım oluşturma, kadro yönetimi.
 */

import { getDB } from '../shared/database';
import { createLogger } from '../shared/logger';
import { GAME_CONSTANTS, Position, Formation, type StatName } from '../shared/types';
import {
  generateStarterPack,
  calculateOverall,
  calculateMarketValue,
  calculateSalary,
} from '../engine/playerGenerator';

const log = createLogger('teamService');

/**
 * Kullanıcıyı kaydet ve takım oluştur.
 */
export async function registerUser(
  tgId: bigint,
  username: string | undefined,
  teamName: string,
): Promise<{ userId: number; teamId: number; playerCount: number }> {
  const db = getDB();

  // İsim kontrolü
  const existingTeam = await db.team.findUnique({ where: { name: teamName } });
  if (existingTeam) {
    throw new Error(`"${teamName}" isimli bir takım zaten mevcut. Farklı bir isim seçin.`);
  }

  // Starter pack üret
  const { players } = generateStarterPack();

  // Transaction ile hepsini birden kaydet
  const result = await db.$transaction(async (tx) => {
    // 1. User oluştur
    const user = await tx.user.create({
      data: {
        tgId,
        username: username || null,
        coins: GAME_CONSTANTS.STARTING_COINS,
        isNewPlayer: true,
        newPlayerUntil: new Date(Date.now() + GAME_CONSTANTS.NEW_PLAYER_PROTECTION_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    // 2. Team oluştur
    const team = await tx.team.create({
      data: {
        userId: user.id,
        name: teamName,
        formation: Formation.F442,
        tactic: 'BALANCED',
      },
    });

    // 3. Futbolcuları oluştur
    const createdPlayers = await Promise.all(
      players.map((p) =>
        tx.player.create({
          data: {
            teamId: team.id,
            name: p.name,
            age: p.age,
            position: p.position,
            isStarter: p.isStarter,
            jerseyNumber: p.jerseyNumber,
            speed: p.speed,
            shooting: p.shooting,
            passing: p.passing,
            dribbling: p.dribbling,
            defense: p.defense,
            physical: p.physical,
            goalkeeping: p.goalkeeping,
            overall: p.overall,
            marketValue: p.marketValue,
            salary: p.salary,
            morale: 70,
            form: 50,
            fitness: 100,
          },
        }),
      ),
    );

    // 4. Power rating hesapla (starter'ların ortalaması)
    const starters = createdPlayers.filter((_, i) => players[i].isStarter);
    const avgOverall =
      starters.reduce((sum, p) => sum + p.overall, 0) / starters.length;

    await tx.team.update({
      where: { id: team.id },
      data: { powerRating: Math.round(avgOverall * 10) / 10 },
    });

    // 5. Başlangıç işlemi kaydet
    await tx.transaction.create({
      data: {
        userId: user.id,
        amount: GAME_CONSTANTS.STARTING_COINS,
        type: 'STARTING_BONUS',
        description: 'Başlangıç bütcesi',
      },
    });

    return { userId: user.id, teamId: team.id, playerCount: createdPlayers.length };
  });

  log.info(`Yeni takım: "${teamName}" (userId=${result.userId}, ${result.playerCount} oyuncu)`);
  return result;
}

/**
 * Kullanıcıyı TG ID ile bul.
 */
export async function findUserByTgId(tgId: bigint) {
  return getDB().user.findUnique({
    where: { tgId },
    include: { team: true },
  });
}

/**
 * Takım kadrosunu getir.
 */
export async function getSquad(teamId: number) {
  const players = await getDB().player.findMany({
    where: { teamId },
    orderBy: [
      { isStarter: 'desc' },
      { jerseyNumber: 'asc' },
    ],
  });

  const starters = players.filter((p) => p.isStarter);
  const subs = players.filter((p) => !p.isStarter);

  return { starters, subs, total: players.length };
}

/**
 * Formasyon değiştir.
 */
export async function changeFormation(teamId: number, formation: Formation) {
  await getDB().team.update({
    where: { id: teamId },
    data: { formation },
  });
  log.info(`Formasyon değiştirildi: teamId=${teamId}, formation=${formation}`);
}

/**
 * Takım power rating'ini yeniden hesapla.
 */
export async function recalculatePowerRating(teamId: number): Promise<number> {
  const starters = await getDB().player.findMany({
    where: { teamId, isStarter: true },
  });

  if (starters.length === 0) return 0;

  const avgOverall = starters.reduce((sum, p) => sum + p.overall, 0) / starters.length;
  const powerRating = Math.round(avgOverall * 10) / 10;

  await getDB().team.update({
    where: { id: teamId },
    data: { powerRating },
  });

  return powerRating;
}

/**
 * Oyuncu değiştir (swap starter/sub).
 */
export async function swapPlayers(
  teamId: number,
  playerInId: number,
  playerOutId: number,
): Promise<void> {
  const db = getDB();

  const [playerIn, playerOut] = await Promise.all([
    db.player.findFirst({ where: { id: playerInId, teamId } }),
    db.player.findFirst({ where: { id: playerOutId, teamId } }),
  ]);

  if (!playerIn || !playerOut) {
    throw new Error('Oyuncular bulunamadı veya takımınıza ait değil.');
  }

  await db.$transaction([
    db.player.update({
      where: { id: playerInId },
      data: { isStarter: true, jerseyNumber: playerOut.jerseyNumber },
    }),
    db.player.update({
      where: { id: playerOutId },
      data: { isStarter: false, jerseyNumber: playerIn.jerseyNumber },
    }),
  ]);

  await recalculatePowerRating(teamId);
  log.info(`Oyuncu swap: ${playerIn.name} <-> ${playerOut.name} (teamId=${teamId})`);
}

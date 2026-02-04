/**
 * ⚽ Football Manager — Fikstür Oluşturucu
 *
 * Round-robin fikstür, ev sahibi/deplasman dengesi, maç tarihi atama.
 */

import { getDB } from '../shared/database';
import { createLogger } from '../shared/logger';

const log = createLogger('fixtureGenerator');

// =============================================
// Round-Robin Fikstür Üretimi
// =============================================

interface FixtureMatch {
  homeTeamId: string;
  awayTeamId: string;
  week: number;
}

/**
 * Round-robin formatında fikstür oluştur.
 * Her takım diğer tüm takımlarla birer kez oynar (tek devreli).
 * Çift devreli lig için fonksiyon 2 kez çağrılır (home/away swap).
 */
export function generateRoundRobinFixtures(teamIds: string[]): FixtureMatch[] {
  const teams = [...teamIds];
  const fixtures: FixtureMatch[] = [];

  // Tek sayı takım varsa BYE ekle
  if (teams.length % 2 !== 0) {
    teams.push('BYE');
  }

  const n = teams.length;
  const totalWeeks = n - 1;
  const matchesPerWeek = n / 2;

  for (let week = 0; week < totalWeeks; week++) {
    for (let match = 0; match < matchesPerWeek; match++) {
      const home = match === 0 ? 0 : ((week + match - 1) % (n - 1)) + 1;
      const away = match === 0 ? ((week) % (n - 1)) + 1 : ((week - match + n - 2) % (n - 1)) + 1;

      const homeTeam = teams[home];
      const awayTeam = teams[away];

      // BYE maçlarını atla
      if (homeTeam === 'BYE' || awayTeam === 'BYE') continue;

      // Ev sahibi/deplasman dengeleme: Çift haftalarda swap
      if (week % 2 === 0) {
        fixtures.push({ homeTeamId: homeTeam, awayTeamId: awayTeam, week: week + 1 });
      } else {
        fixtures.push({ homeTeamId: awayTeam, awayTeamId: homeTeam, week: week + 1 });
      }
    }
  }

  return fixtures;
}

/**
 * Çift devreli lig fikstürü oluştur (ilk yarı + rövanş).
 */
export function generateDoubleRoundRobin(teamIds: string[]): FixtureMatch[] {
  const firstHalf = generateRoundRobinFixtures(teamIds);
  const totalFirstHalfWeeks = firstHalf.length > 0
    ? Math.max(...firstHalf.map(f => f.week))
    : 0;

  // İkinci yarı: home/away swap + hafta offset
  const secondHalf = firstHalf.map(f => ({
    homeTeamId: f.awayTeamId,
    awayTeamId: f.homeTeamId,
    week: f.week + totalFirstHalfWeeks,
  }));

  return [...firstHalf, ...secondHalf];
}

// =============================================
// DB'ye Fikstür Kaydet
// =============================================

/**
 * Oluşturulan fikstürü veritabanına kaydet.
 */
export async function saveFixturesToDB(
  seasonId: string,
  leagueId: string,
  fixtures: FixtureMatch[],
  startDate?: Date,
): Promise<number> {
  const db = getDB();
  let created = 0;

  const baseDate = startDate || new Date();

  for (const fixture of fixtures) {
    // Her hafta için tarih hesapla (hafta başına 3-4 gün aralık)
    const matchDate = new Date(baseDate);
    matchDate.setDate(matchDate.getDate() + (fixture.week - 1) * 3);

    await db.match.create({
      data: {
        seasonId,
        leagueId,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        week: fixture.week,
        scheduledAt: matchDate,
        status: 'SCHEDULED',
      },
    });
    created++;
  }

  log.info(`Fikstür kaydedildi: ${created} maç, sezon: ${seasonId}, lig: ${leagueId}`);
  return created;
}

// =============================================
// Haftalık Maçları Getir
// =============================================

/**
 * Belirli bir haftanın maçlarını getir.
 */
export async function getWeekFixtures(seasonId: string, week: number) {
  const db = getDB();

  return db.match.findMany({
    where: { seasonId, week },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

/**
 * Fikstür istatistikleri.
 */
export async function getFixtureStats(seasonId: string): Promise<{
  totalMatches: number;
  played: number;
  scheduled: number;
  totalWeeks: number;
}> {
  const db = getDB();

  const [totalMatches, played] = await Promise.all([
    db.match.count({ where: { seasonId } }),
    db.match.count({ where: { seasonId, status: 'PLAYED' } }),
  ]);

  const maxWeek = await db.match.aggregate({
    where: { seasonId },
    _max: { week: true },
  });

  return {
    totalMatches,
    played,
    scheduled: totalMatches - played,
    totalWeeks: maxWeek._max.week || 0,
  };
}

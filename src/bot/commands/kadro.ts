import type { BotContext } from '../index';
import { createLogger } from '../../shared/logger';
import { findUserByTgId, getSquad } from '../../services/teamService';
import { Position } from '../../shared/types';

const log = createLogger('bot:kadro');

// Pozisyon emojileri
const POS_EMOJI: Record<string, string> = {
  [Position.GK]: '🧤',
  [Position.CB]: '🛡️',
  [Position.LB]: '⬅️',
  [Position.RB]: '➡️',
  [Position.CDM]: '🔰',
  [Position.CM]: '⚙️',
  [Position.CAM]: '🎯',
  [Position.LW]: '🏃',
  [Position.RW]: '🏃',
  [Position.ST]: '⚽',
  [Position.WB]: '🔄',
};

function fitnessBar(fitness: number): string {
  if (fitness >= 80) return '🟢';
  if (fitness >= 50) return '🟡';
  return '🔴';
}

export async function kadroCommand(ctx: BotContext): Promise<void> {
  const tgId = ctx.from?.id;
  if (!tgId) return;

  try {
    const user = await findUserByTgId(BigInt(tgId));
    if (!user?.team) {
      await ctx.reply('⚽ Henüz bir takımın yok! /start ile başla.');
      return;
    }

    const { starters, subs, total } = await getSquad(user.team.id);

    // Başlık
    let msg = `📋 *${user.team.name}* — Kadro\n`;
    msg += `🎮 Formasyon: ${user.team.formation.replace('F', '')}\n`;
    msg += `⭐ Güç: ${user.team.powerRating.toFixed(1)} OVR\n`;
    msg += `👥 ${total} oyuncu\n\n`;

    // İlk 11
    msg += `*——— İlk 11 ———*\n`;
    for (const p of starters) {
      const emoji = POS_EMOJI[p.position] || '⚽';
      const fit = fitnessBar(p.fitness);
      const injury = p.injuryDuration > 0 ? ' 🏥' : '';
      const suspended = p.suspendedUntil > 0 ? ' 🟥' : '';
      msg += `${emoji} #${p.jerseyNumber} *${p.name}* (${p.position}) — ${p.overall.toFixed(0)} OVR ${fit}${injury}${suspended}\n`;
    }

    // Yedekler
    msg += `\n*——— Yedekler ———*\n`;
    for (const p of subs) {
      const emoji = POS_EMOJI[p.position] || '⚽';
      const fit = fitnessBar(p.fitness);
      const injury = p.injuryDuration > 0 ? ' 🏥' : '';
      msg += `${emoji} #${p.jerseyNumber} ${p.name} (${p.position}) — ${p.overall.toFixed(0)} OVR ${fit}${injury}\n`;
    }

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    log.error('/kadro hatası:', error);
    await ctx.reply('❌ Kadro yüklenirken hata oluştu.');
  }
}

import type { NextFunction } from 'grammy';

import type { BotContext } from '../index';
import { createLogger } from '../../shared/logger';

const log = createLogger('bot:auth');

/**
 * Kullan\u0131c\u0131n\u0131n kay\u0131tl\u0131 olup olmad\u0131\u011F\u0131n\u0131 kontrol eden middleware.
 * Kay\u0131tl\u0131 de\u011Filse /start'a y\u00F6nlendirir.
 */
export async function authMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  const tgId = ctx.from?.id;

  if (!tgId) {
    await ctx.reply('\u274C Kullan\u0131c\u0131 bilgisi al\u0131namad\u0131.');
    return;
  }

  try {
    // TODO: Faz 1'de ger\u00E7ek DB kontrol\u00FC eklenecek
    // const user = await getDB().user.findUnique({
    //   where: { tgId: BigInt(tgId) },
    //   include: { team: true },
    // });
    //
    // if (!user || !user.team) {
    //   await ctx.reply('\u26BD Hen\u00FCz kay\u0131tl\u0131 de\u011Filsin! /start ile ba\u015Fla.');
    //   return;
    // }
    //
    // ctx.session.userId = user.id;
    // ctx.session.teamId = user.team.id;

    await next();
  } catch (error) {
    log.error('Auth middleware hatas\u0131:', error);
    await ctx.reply('\u274C Bir hata olu\u015Ftu. L\u00FCtfen tekrar deneyin.');
  }
}

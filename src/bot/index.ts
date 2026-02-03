import { Bot, session, GrammyError, HttpError } from 'grammy';
import type { Context, SessionFlavor } from 'grammy';

import { config } from '../shared/config';
import { createLogger } from '../shared/logger';
import { startCommand } from './commands/start';
import { mainMenuKeyboard } from './keyboards/mainMenu';

const log = createLogger('bot');

// === Session Tipi ===
export interface SessionData {
  step?: string;
  pendingTeamName?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;

// === Bot Instance ===
let bot: Bot<BotContext> | null = null;

export function getBot(): Bot<BotContext> {
  if (!bot) {
    bot = new Bot<BotContext>(config.BOT_TOKEN);

    // --- Session Middleware ---
    bot.use(
      session({
        initial: (): SessionData => ({}),
      }),
    );

    // --- Logger Middleware ---
    bot.use(async (ctx, next) => {
      const start = Date.now();
      const userId = ctx.from?.id;
      const text = ctx.message?.text || ctx.callbackQuery?.data || 'unknown';

      log.debug(`Gelen: [${userId}] ${text}`);

      await next();

      const duration = Date.now() - start;
      if (duration > 1000) {
        log.warn(`Yava\u015F i\u015Flem: [${userId}] ${text} (${duration}ms)`);
      }
    });

    // --- Komutlar ---
    bot.command('start', startCommand);

    bot.command('menu', async (ctx) => {
      await ctx.reply('\u26BD Ana Men\u00FC:', { reply_markup: mainMenuKeyboard });
    });

    // --- Callback Query Handler (Ana Men\u00FC) ---
    bot.callbackQuery('menu:kadro', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('\uD83D\uDCCB Kadro ekran\u0131 (Faz 1\'de eklenecek)');
    });

    bot.callbackQuery('menu:lig', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('\uD83D\uDCCA Lig tablosu (Faz 2\'de eklenecek)');
    });

    bot.callbackQuery('menu:antrenman', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('\uD83C\uDFCB\uFE0F Antrenman (Faz 3\'te eklenecek)');
    });

    bot.callbackQuery('menu:transfer', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('\uD83D\uDCB0 Transfer pazar\u0131 (Faz 2\'de eklenecek)');
    });

    bot.callbackQuery('menu:profil', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('\uD83D\uDC64 Profil (Faz 3\'te eklenecek)');
    });

    bot.callbackQuery('menu:ayarlar', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('\u2699\uFE0F Ayarlar (Faz 3\'te eklenecek)');
    });

    // --- Error Handler ---
    bot.catch((err) => {
      const ctx = err.ctx;
      const e = err.error;

      log.error(`Bot hatas\u0131 [${ctx.from?.id}]:`, e);

      if (e instanceof GrammyError) {
        log.error('Grammy API hatas\u0131:', e.description);
      } else if (e instanceof HttpError) {
        log.error('HTTP hatas\u0131:', e);
      }

      // Kullan\u0131c\u0131ya hata bildirimi
      ctx.reply('\u274C Bir hata olu\u015Ftu. L\u00FCtfen tekrar deneyin.').catch(() => {});
    });
  }

  return bot;
}

export async function startBot(): Promise<void> {
  const b = getBot();
  log.info('\uD83E\uDD16 Telegram Bot ba\u015Flat\u0131l\u0131yor...');
  b.start({
    onStart: () => {
      log.info(`\u2705 Bot ba\u015Flat\u0131ld\u0131: @${config.BOT_USERNAME}`);
    },
  });
}

export async function stopBot(): Promise<void> {
  if (bot) {
    bot.stop();
    log.info('Bot durduruldu');
  }
}

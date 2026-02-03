import type { BotContext } from '../index';
import { mainMenuKeyboard } from '../keyboards/mainMenu';
import { createLogger } from '../../shared/logger';

const log = createLogger('bot:start');

export async function startCommand(ctx: BotContext): Promise<void> {
  const tgId = ctx.from?.id;
  const username = ctx.from?.username;

  if (!tgId) {
    await ctx.reply('\u274C Kullan\u0131c\u0131 bilgisi al\u0131namad\u0131.');
    return;
  }

  log.info(`/start komutu: tgId=${tgId}, username=${username}`);

  try {
    // TODO: Faz 1'de DB kontrol\u00FC eklenecek
    // const existingUser = await getDB().user.findUnique({ where: { tgId: BigInt(tgId) } });
    // if (existingUser) { ... zaten kay\u0131tl\u0131 ... }

    // Yeni oyuncu ho\u015F geldin mesaj\u0131
    await ctx.reply(
      `\u26BD *Football Manager'a Ho\u015F Geldin!*\n\n` +
        `Kendi futbol tak\u0131m\u0131n\u0131 kur, antrenman yap, transfer yap ve \u015Fampiyon ol!\n\n` +
        `Kay\u0131t olmak i\u00E7in tak\u0131m ismini yaz:`,
      { parse_mode: 'Markdown' },
    );

    // Session'a kay\u0131t ad\u0131m\u0131n\u0131 kaydet
    ctx.session.step = 'awaiting_team_name';
  } catch (error) {
    log.error('/start hatas\u0131:', error);
    await ctx.reply('\u274C Bir hata olu\u015Ftu. L\u00FCtfen /start ile tekrar deneyin.');
  }
}

// Tak\u0131m ismi al\u0131c\u0131s\u0131 (bu fonksiyon Faz 1'de geni\u015Fletilecek)
export async function handleTeamNameInput(ctx: BotContext): Promise<void> {
  if (ctx.session.step !== 'awaiting_team_name') return;

  const teamName = ctx.message?.text?.trim();

  if (!teamName) {
    await ctx.reply('\u274C L\u00FCtfen ge\u00E7erli bir tak\u0131m ismi girin.');
    return;
  }

  if (teamName.length > 30) {
    await ctx.reply('\u274C Tak\u0131m ismi en fazla 30 karakter olabilir.');
    return;
  }

  if (teamName.length < 2) {
    await ctx.reply('\u274C Tak\u0131m ismi en az 2 karakter olmal\u0131.');
    return;
  }

  log.info(`Tak\u0131m olu\u015Fturuluyor: "${teamName}" (tgId=${ctx.from?.id})`);

  // TODO: Faz 1'de ger\u00E7ek DB kayd\u0131 yap\u0131lacak
  // - User olu\u015Ftur
  // - Team olu\u015Ftur
  // - generateStarterPack() ile 18 futbolcu olu\u015Ftur
  // - power_rating hesapla

  ctx.session.step = undefined;
  ctx.session.pendingTeamName = undefined;

  await ctx.reply(
    `\u2705 Tak\u0131m\u0131n *${teamName}* olu\u015Fturuldu!\n\n` +
      `\uD83C\uDFC6 18 futbolcu kadronuza eklendi\n` +
      `\uD83D\uDCB0 Ba\u015Flang\u0131\u00E7 b\u00FCtcesi: 50.000 coin\n\n` +
      `\u0130yi oyunlar! \u26BD`,
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenuKeyboard,
    },
  );
}

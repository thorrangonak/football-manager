import { InlineKeyboard } from 'grammy';

export const mainMenuKeyboard = new InlineKeyboard()
  .text('\u26BD Kadro', 'menu:kadro')
  .text('\uD83D\uDCCA Lig Tablosu', 'menu:lig')
  .row()
  .text('\uD83C\uDFCB\uFE0F Antrenman', 'menu:antrenman')
  .text('\uD83D\uDCB0 Transfer', 'menu:transfer')
  .row()
  .text('\uD83D\uDC64 Profil', 'menu:profil')
  .text('\u2699\uFE0F Ayarlar', 'menu:ayarlar');

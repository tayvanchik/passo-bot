/**
 * PASSO — Telegram bot backend
 * -----------------------------
 * Bu skript Mini App'dan (passo-miniapp.html) kelgan buyurtmalarni
 * qabul qilib, ADMIN_CHAT_ID'ga (ya'ni sizga) to'liq ma'lumot — jumladan
 * mijoz yozgan IZOH bilan birga — xabar qilib yuboradi.
 *
 * O'RNATISH:
 *   1) npm init -y
 *   2) npm install node-telegram-bot-api
 *   3) Quyidagi BOT_TOKEN va ADMIN_CHAT_ID qiymatlarini to'ldiring
 *   4) node passo-bot.js
 *
 * ADMIN_CHAT_ID'ni qanday topish mumkin:
 *   Telegram'da @userinfobot'ga /start yozing — u sizga "Id" raqamingizni
 *   ko'rsatadi (masalan 123456789). Shu raqamni pastga qo'ying.
 */
 
const TelegramBot = require('node-telegram-bot-api');
 
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
 
if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.error('XATOLIK: BOT_TOKEN va ADMIN_CHAT_ID muhit o\'zgaruvchilari kiritilmagan!');
  process.exit(1);
}
 
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
 
// Mini App tugmasini ko'rsatuvchi /start buyrug'i
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "PASSO'ga xush kelibsiz! Do'konni ochish uchun pastdagi tugmani bosing.", {
    reply_markup: {
      keyboard: [[{
        text: "🛍 Do'konni ochish",
        web_app: { url: 'https://lucent-twilight-79d21e.netlify.app' }
      }]],
      resize_keyboard: true
    }
  });
});
 
// Mini App'dan kelgan ma'lumotni qayta ishlash
bot.on('message', (msg) => {
  if (!msg.web_app_data) return;
 
  try {
    const data = JSON.parse(msg.web_app_data.data);
    if (data.type !== 'order') return;
 
    const customer = msg.from;
    const customerName = customer.first_name || 'Mijoz';
    const customerUsername = customer.username ? `@${customer.username}` : "username yo'q";
 
    let total = 0;
    let itemsText = '';
 
    data.items.forEach((item, i) => {
      const lineTotal = item.price * item.qty;
      total += lineTotal;
      itemsText += `\n${i + 1}. 👟 <b>${item.name}</b>\n`;
      itemsText += `   O'lcham: ${item.size}   Soni: ${item.qty}\n`;
      itemsText += `   Narx: ${item.price.toLocaleString('ru-RU')} so'm\n`;
      if (item.comment && item.comment.trim() !== '') {
        itemsText += `   💬 <b>Izoh:</b> ${item.comment}\n`;
      }
    });
 
    const adminMessage =
      `🆕 <b>Yangi buyurtma — PASSO</b>\n` +
      `👤 Mijoz: ${customerName} (${customerUsername})\n` +
      `🆔 Chat ID: <code>${msg.chat.id}</code>\n` +
      itemsText +
      `\n💰 <b>Jami: ${total.toLocaleString('ru-RU')} so'm</b>`;
 
    // Admin (siz)ga yuboriladi
    bot.sendMessage(ADMIN_CHAT_ID, adminMessage, { parse_mode: 'HTML' });
 
    // Mijozga tasdiq xabari
    bot.sendMessage(msg.chat.id, "✅ Buyurtmangiz qabul qilindi! Tez orada operatorimiz siz bilan bog'lanadi.");
 
  } catch (err) {
    console.error('Buyurtmani qayta ishlashda xatolik:', err);
  }
});
 
console.log('PASSO bot ishga tushdi...');

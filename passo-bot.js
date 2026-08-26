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
  const caption =
    "Assalomu alaykum! 👋\n\n" +
    "Bu <b>PASSO</b> — erkaklar uchun oyoq kiyimlari do'koni.\n\n" +
    "Krossovkalar, botinkalar, sport va klassik poyabzallar bir ilovada.\n\n" +
    "Sifatli mahsulotlar \n" +
    "Zamonaviy modellar \n" +
    "Turli xil o'lchamlar \n" +
    "Buyurtma asosida olib ketish \n\n" +
    "Siz tanlang - biz olib kelamiz. \n\n" +
    "Kerakli modelni tanlang va buyurtma bering — hammasi bir necha daqiqada!";
 
  const options = {
    caption,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{
        text: "🛍 Do'konni ochish",
        web_app: { url: 'https://lucent-twilight-79d21e.netlify.app' }
      }]]
    }
  };
 
  // HERO_IMAGE_URL joyiga o'z logotipingiz yoki mahsulot rasmingiz havolasini qo'ying.
  // Agar hali rasm bo'lmasa, faqat matn xabar yuboriladi.
  const HERO_IMAGE_URL = 'https://raw.githubusercontent.com/tayvanchik/passo-bot/main/logo.png';
 
  if (HERO_IMAGE_URL) {
    bot.sendPhoto(msg.chat.id, HERO_IMAGE_URL, options);
  } else {
    bot.sendMessage(msg.chat.id, caption, options);
  }
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
 
    let addressText = '';
    if (data.address && (data.address.name || data.address.phone || data.address.address || data.address.location)) {
      addressText += `\n📍 <b>Yetkazib berish ma'lumoti:</b>\n`;
      if (data.address.name) addressText += `   Ism: ${data.address.name}\n`;
      if (data.address.phone) addressText += `   Tel: ${data.address.phone}\n`;
      if (data.address.address) addressText += `   Manzil: ${data.address.address}\n`;
      if (data.address.location) addressText += `   🗺 Lokatsiya: ${data.address.location}\n`;
    }
 
    const adminMessage =
      `🆕 <b>Yangi buyurtma — PASSO</b>\n` +
      `👤 Mijoz: ${customerName} (${customerUsername})\n` +
      `🆔 Chat ID: <code>${msg.chat.id}</code>\n` +
      itemsText +
      addressText +
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
 
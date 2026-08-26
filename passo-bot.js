/**
 * PASSO — Telegram bot backend
 * -----------------------------
 * Bu skript ikkita vazifani bajaradi:
 * 1) Telegram bot sifatida ishlaydi (/start buyrug'i)
 * 2) Kichik web-server sifatida ishlaydi — Mini App'dan (passo-miniapp.html)
 *    kelgan buyurtmalarni internet orqali qabul qilib, ADMIN_CHAT_ID'ga
 *    (ya'ni sizga) to'liq ma'lumot — jumladan mijoz yozgan IZOH bilan
 *    birga — xabar qilib yuboradi.
 *
 * Buyurtma qanday tugma orqali ochilishidan qat'iy nazar (Menu Button,
 * inline tugma, va h.k.) ishlaydi — Telegram'ning sendData cheklovidan
 * mustaqil.
 *
 * O'RNATISH:
 *   1) npm init -y
 *   2) npm install node-telegram-bot-api express
 *   3) Railway'da BOT_TOKEN va ADMIN_CHAT_ID muhit o'zgaruvchilarini kiriting
 *   4) node passo-bot.js
 *
 * ADMIN_CHAT_ID'ni qanday topish mumkin:
 *   Telegram'da @userinfobot'ga /start yozing — u sizga "Id" raqamingizni
 *   ko'rsatadi (masalan 123456789). Shu raqamni pastga qo'ying.
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

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
    "Bu <b>PASSO</b> — erkaklar uchun original oyoq kiyimlari do'koni.\n\n" +
    "👟 Krossovkalar, botinkalar, sport va klassik poyabzallar bir ilovada.\n\n" +
    "Har bir mahsulot sifatli va bardoshli materiallardan tayyorlangan.\n\n" +
    "Kerakli mahsulotni tanlang, o'lchamingizni belgilang va buyurtma bering — hammasi bir necha daqiqada! 👇";

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

  const HERO_IMAGE_URL = 'https://raw.githubusercontent.com/tayvanchik/passo-bot/main/logo.png';

  if (HERO_IMAGE_URL) {
    bot.sendPhoto(msg.chat.id, HERO_IMAGE_URL, options);
  } else {
    bot.sendMessage(msg.chat.id, caption, options);
  }
});

// ---------- Buyurtmani qayta ishlash (umumiy funksiya) ----------
function processOrder(data, customer, replyChatId) {
  const customerName = customer?.first_name || 'Mijoz';
  const customerUsername = customer?.username ? `@${customer.username}` : "username yo'q";

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
    (replyChatId ? `🆔 Chat ID: <code>${replyChatId}</code>\n` : '') +
    itemsText +
    addressText +
    `\n💰 <b>Jami: ${total.toLocaleString('ru-RU')} so'm</b>`;

  // Admin (siz)ga yuboriladi
  bot.sendMessage(ADMIN_CHAT_ID, adminMessage, { parse_mode: 'HTML' });

  // Mijozga tasdiq xabari (agar chat ID mavjud bo'lsa)
  if (replyChatId) {
    bot.sendMessage(replyChatId, "✅ Buyurtmangiz qabul qilindi! Tez orada operatorimiz siz bilan bog'lanadi.")
      .catch(() => {}); // agar mijoz botni bloklagan bo'lsa, xatolikni e'tiborsiz qoldiramiz
  }
}

// Eski usul: Reply Keyboard orqali ochilgan Mini App'lar uchun (agar bo'lsa)
bot.on('message', (msg) => {
  if (!msg.web_app_data) return;
  try {
    const data = JSON.parse(msg.web_app_data.data);
    if (data.type !== 'order') return;
    processOrder(data, msg.from, msg.chat.id);
  } catch (err) {
    console.error('Buyurtmani qayta ishlashda xatolik:', err);
  }
});

// ---------- Web-server (Mini App'dan to'g'ridan-to'g'ri kelgan buyurtmalar uchun) ----------
const app = express();
app.use(express.json());

// CORS — Netlify saytidan so'rov yuborishga ruxsat berish
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.send('PASSO bot server ishlayapti.');
});

app.post('/api/order', (req, res) => {
  try {
    const { items, address, user } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: "Mahsulotlar ro'yxati bo'sh" });
    }
    processOrder({ items, address }, user, user?.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('API orqali buyurtmani qayta ishlashda xatolik:', err);
    res.status(500).json({ ok: false, error: 'Server xatoligi' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PASSO server ${PORT}-portda ishga tushdi...`);
});

console.log('PASSO bot ishga tushdi...');


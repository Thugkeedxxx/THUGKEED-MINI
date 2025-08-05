const express = require('express');
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const app = express();
const PORT = process.env.PORT || 3000;

const { state, saveState } = useSingleFileAuthState('./auth.json');

async function startBot() {
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting...', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ THUGKEED-MINI BOT CONNECTED');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!body) return;

    const reply = (text) => {
      sock.sendMessage(from, { text }, { quoted: msg });
    };

    // 🧠 Basic Commands
    if (body === '!ping') return reply('🏓 Pong!');
    if (body === '!owner') return reply('👑 THUGKEED\nwa.me/2347049474372');
    if (body === '!menu') return reply(`
*🤖 THUGKEED-MINI MENU*
> !ping - Test Bot
> !owner - Bot Owner
> !sticker - Image to Sticker
> !menu - Show this Menu
    `);

    // 🧊 Sticker Feature
    if (body === '!sticker' && msg.message.imageMessage) {
      const stream = await downloadMediaMessage(msg, 'buffer');
      await sock.sendMessage(from, { sticker: stream }, { quoted: msg });
    }
  });
}

startBot();
app.get('/', (req, res) => res.send('🤖 THUGKEED-MINI is running!'));
app.listen(PORT, () => console.log(`🌐 Server running on http://localhost:${PORT}`));

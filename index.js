const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const axios = require('axios');
const moment = require('moment');
const ytdl = require('ytdl-core');
require('dotenv').config();

const prefix = process.env.PREFIX || '!';
const OWNER = process.env.OWNER_NUMBER || '2349012345678';

const store = makeInMemoryStore({
  logger: P().child({ level: 'silent', stream: 'store' })
});

store?.readFromFile('./baileys_store.json');
setInterval(() => {
  store?.writeToFile('./baileys_store.json');
}, 10_000);

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ['THUGKEED-LITE-MD', 'Chrome', '1.0.0']
  });

  store.bind(sock.ev);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const type = Object.keys(msg.message)[0];
    const body = type === 'conversation'
      ? msg.message.conversation
      : type === 'extendedTextMessage'
      ? msg.message.extendedTextMessage.text
      : '';

    if (!body.startsWith(prefix)) return;
    const args = body.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- THUGKEED Commands ---
    if (command === 'ping') {
      await sock.sendMessage(from, { text: '```THUGKEED-LITE-MD is Online ✅```' }, { quoted: msg });
    }

    if (command === 'owner') {
      await sock.sendMessage(from, { text: `👑 Owner: wa.me/${OWNER}` }, { quoted: msg });
    }

    if (command === 'play') {
      const query = args.join(' ');
      if (!query) return sock.sendMessage(from, { text: 'Please provide a song name.' }, { quoted: msg });

      try {
        const ytSearch = await axios.get(`https://yt.btch.bz/search?query=${encodeURIComponent(query)}`);
        const video = ytSearch.data[0];

        if (!video || !video.videoId) {
          return sock.sendMessage(from, { text: 'No results found.' }, { quoted: msg });
        }

        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${video.videoId}`);
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const audioUrl = audioFormats[0].url;

        await sock.sendMessage(from, {
          audio: { url: audioUrl },
          mimetype: 'audio/mp4',
          fileName: `${video.title}.mp3`
        }, { quoted: msg });

        await sock.sendMessage(from, {
          text: `🎶 Downloaded by *THUGKEED-LITE-MD*\n\n📌 Title: ${video.title}\n🔗 Source: YouTube`,
        }, { quoted: msg });

      } catch (err) {
        console.log(err);
        sock.sendMessage(from, { text: 'Failed to download.' }, { quoted: msg });
      }
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ BOT CONNECTED - THUGKEED-LITE-MD');
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startBot();

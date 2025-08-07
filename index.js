require('dotenv').config();
const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

const prefix = process.env.PREFIX || '.';

async function startBot() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ THUGKEED-LITE-MD is now connected!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (!body.startsWith(prefix)) return;

    const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);

    console.log(`📥 Command: ${command} | From: ${from}`);

    // Commands
    switch (command) {
      case 'menu':
        await sock.sendMessage(from, {
          text: `👋 *Welcome to THUGKEED-LITE-MD*

Prefix: *${prefix}*

📚 *Available Commands:*
${prefix}menu
${prefix}play <song name>
${prefix}owner
${prefix}repo`
        });
        break;

      case 'play':
        if (!args[0]) return await sock.sendMessage(from, { text: '❌ Please provide a song name.' });
        const search = await yts(args.join(' '));
        const song = search.videos[0];
        if (!song) return await sock.sendMessage(from, { text: '❌ Song not found.' });

        const title = song.title;
        const url = song.url;
        const info = await ytdl.getInfo(url);
        const audio = ytdl(url, { filter: 'audioonly' });

        const filePath = `./${title}.mp3`;
        const writeStream = fs.createWriteStream(filePath);
        audio.pipe(writeStream);
        writeStream.on('finish', async () => {
          const audioBuffer = fs.readFileSync(filePath);
          await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            fileName: `${title}.mp3`
          });
          fs.unlinkSync(filePath);
        });
        break;

      case 'owner':
        await sock.sendMessage(from, {
          text: `👑 *Owner:* THUGKEED
📞 WhatsApp: https://wa.me/2347049474372
📢 Channel: https://whatsapp.com/channel/0029VbB7a9v6LwHqDUERef0M`
        });
        break;

      case 'repo':
        await sock.sendMessage(from, {
          text: `📦 GitHub Repo: https://github.com/thugkeedxxx/THUGKEED-LITE-MD`
        });
        break;

      default:
        await sock.sendMessage(from, { text: `❓ Unknown command: *${command}*` });
    }
  });
}

startBot();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const axios = require('axios');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

// Your config - put your prefix and pair site URL in config.js or replace below
const config = {
  prefix: '.',
  pairSite: process.env.PAIR_SITE || 'https://thugkeed-lite-md-pair.onrender.com/pair'
};

// Ensure session folder exists
const SESSION_DIR = path.join(__dirname, 'auth_info_multi');
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// Fetch session from PAIR_SITE
async function fetchSession() {
  try {
    const response = await axios.get(`${config.pairSite}/session`);
    fs.writeFileSync(
      path.join(SESSION_DIR, 'creds.json'),
      JSON.stringify(response.data, null, 2)
    );
    console.log('✅ Session data saved successfully!');
  } catch (err) {
    console.error('❌ Failed to fetch session:', err.message);
    process.exit(1);
  }
}

async function startBot() {
  await fetchSession();

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ Logged out. Reconnecting...');
        startBot();
      } else {
        console.log('❌ Connection closed. Reconnecting...');
        startBot();
      }
    } else if (connection === 'open') {
      console.log('🤖 Bot connected to WhatsApp!');
    }
  });

  // Command handler function
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant || from;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const args = body.trim().split(/ +/);
    const command = args[0].toLowerCase();

    // Only respond if message starts with prefix
    if (!body.startsWith(config.prefix)) return;

    switch (command) {
      case `${config.prefix}ping`:
        await sock.sendMessage(from, { text: '🏓 Pong!' });
        break;

      case `${config.prefix}help`:
        await sock.sendMessage(from, {
          text: `
⚡️ *THUGKEED-LITE-MD Commands* ⚡️

${config.prefix}ping - Check if bot is alive
${config.prefix}play <song name> - Download and play song (YouTube)
${config.prefix}help - Show this help message
`
        });
        break;

      case `${config.prefix}play`:
        if (args.length < 2) {
          await sock.sendMessage(from, { text: '❌ Usage: .play <song name>' });
          break;
        }
        const query = args.slice(1).join(' ');
        await sock.sendMessage(from, { text: `🎵 Searching for: ${query}` });

        // Example: YouTube search & download logic (You can implement your own here)
        // Just a dummy reply for now:
        await sock.sendMessage(from, { text: `Sorry bro, the play command is not fully implemented yet.` });
        break;

      default:
        // Unknown command - ignore or reply
        // await sock.sendMessage(from, { text: `❌ Unknown command: ${command}` });
        break;
    }
  });
}

// Keep Render alive
app.get('/', (req, res) => res.send('THUGKEED-LITE-MD is running!'));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

startBot();

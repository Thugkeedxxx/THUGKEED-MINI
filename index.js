const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const config = require('./config');

async function fetchSession() {
  try {
    const response = await axios.get(`${config.pairSite}/session`);
    if (!fs.existsSync('./auth_info_multi')) fs.mkdirSync('./auth_info_multi', { recursive: true });
    fs.writeFileSync('./auth_info_multi/creds.json', JSON.stringify(response.data));
    console.log('✅ Session data fetched successfully!');
  } catch (err) {
    console.error('❌ Failed to fetch session:', err.message);
    process.exit(1);
  }
}

async function startBot() {
  await fetchSession();

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_multi');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ Logged out. Reconnecting...');
        startBot();
      }
    } else if (connection === 'open') {
      console.log('🤖 THUGKEED-LITE-MD connected to WhatsApp!');
    }
  });

  // Load commands dynamically
  const commands = {};
  const commandsPath = path.join(__dirname, 'commands');
  fs.readdirSync(commandsPath).forEach((file) => {
    if (file.endsWith('.js')) {
      const command = require(path.join(commandsPath, file));
      commands[command.name] = command;
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if (!body.startsWith(config.prefix)) return;

    const args = body.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands[commandName];
    if (!command) {
      await sock.sendMessage(from, { text: `❌ Unknown command *${commandName}*.\nType ${config.prefix}menu for the command list.` });
      return;
    }

    try {
      await command.execute(sock, from, args, msg);
    } catch (err) {
      console.error('Command error:', err);
      await sock.sendMessage(from, { text: '❌ An error occurred while executing the command.' });
    }
  });
}

startBot();

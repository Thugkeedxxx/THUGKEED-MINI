const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const axios = require('axios');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const { Boom } = require('@hapi/boom');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple Express route for keep-alive
app.get('/', (req, res) => res.send('🤖 THUGKEED-LITE-MD is running!'));
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// Fetch session from PAIR site
async function fetchSession() {
    try {
        const response = await axios.get(`${config.pairSite}/session`);
        fs.ensureDirSync('./auth_info_multi');
        fs.writeFileSync('./auth_info_multi/creds.json', JSON.stringify(response.data));
        console.log('✅ Session data fetched successfully!');
    } catch (err) {
        console.error('❌ Failed to fetch session:', err.message);
        process.exit(1);
    }
}

// Load commands dynamically from /commands folder
function loadCommands() {
    const commands = new Map();
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.name && typeof command.execute === 'function') {
            commands.set(command.name, command);
            console.log(`✅ Command loaded: ${command.name}`);
        }
    }
    return commands;
}

async function startBot() {
    await fetchSession();

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_multi');
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
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Logged out. Reconnecting...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🤖 THUGKEED-LITE-MD connected to WhatsApp!');
        }
    });

    const commands = loadCommands();

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const isCmd = body.startsWith(config.prefix);
        if (!isCmd) return;

        const args = body.trim().split(' ').slice(1);
        const commandName = body.slice(config.prefix.length).trim().split(' ')[0].toLowerCase();

        const command = commands.get(commandName);
        if (!command) {
            await sock.sendMessage(from, { text: `❌ Unknown command: *${commandName}*` });
            return;
        }

        try {
            await command.execute(sock, msg, args, from);
        } catch (error) {
            console.error(`❌ Error executing command ${commandName}:`, error);
            await sock.sendMessage(from, { text: '⚠️ Error executing command.' });
        }
    });
}

startBot();

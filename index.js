const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const axios = require('axios');
const pino = require('pino');
const fs = require('fs');
const config = require('./config');
const express = require('express');
const path = require('path');

// Commands
const playCmd = require('./commands/play');
const menuCmd = require('./commands/menu');
const pingCmd = require('./commands/ping');
const groupInfoCmd = require('./commands/groupinfo');
const repoCmd = require('./commands/repo');
const quotesCmd = require('./commands/quotes');

// Create small Express server to keep Render alive
const app = express();
app.get('/', (req, res) => res.send('THUGKEED-LITE-MD Bot is running.'));
app.listen(process.env.PORT || 10000, () => console.log(`✅ Server running on port ${process.env.PORT || 10000}`));

// Auto fetch session from PAIR site
async function fetchSession() {
    try {
        console.log(`🌐 Fetching session from: ${config.pairSite}/session`);
        const response = await axios.get(`${config.pairSite}/session`);
        if (!response.data) throw new Error("Empty session data received");
        fs.mkdirSync('./auth_info_multi', { recursive: true });
        fs.writeFileSync('./auth_info_multi/creds.json', JSON.stringify(response.data, null, 2));
        console.log('✅ Session data fetched successfully!');
    } catch (err) {
        console.error(`❌ Failed to fetch session: ${err.message}`);
        process.exit(1);
    }
}

async function startBot() {
    await fetchSession();

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_multi');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Logged out. Restarting...');
                startBot();
            } else {
                console.log('⚠️ Connection closed. Reconnecting...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🤖 THUGKEED-LITE-MD is now connected to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const isCmd = body.startsWith(config.prefix);
        const command = body.slice(config.prefix.length).trim().split(' ')[0].toLowerCase();
        const args = body.trim().split(' ').slice(1);

        if (!isCmd) return;

        switch (command) {
            case 'ping':
                await pingCmd(sock, from);
                break;
            case 'menu':
                await menuCmd(sock, from);
                break;
            case 'play':
                await playCmd(sock, from, args);
                break;
            case 'groupinfo':
                await groupInfoCmd(sock, from, msg);
                break;
            case 'repo':
                await repoCmd(sock, from);
                break;
            case 'quotes':
                await quotesCmd(sock, from);
                break;
            default:
                await sock.sendMessage(from, { text: `❌ Unknown command: *${command}*` });
        }
    });
}

startBot();

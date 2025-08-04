// 📁 thugkeed-xmd // THUGKEED WhatsApp Bot using Baileys

// 🧠 /index.js (Bot Entry Point) const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys"); const pino = require("pino"); const { Boom } = require("@hapi/boom"); const fs = require("fs"); const path = require("path");

const commands = {}; fs.readdirSync("./commands").forEach(file => { const name = file.split(".")[0]; commands[name] = require(./commands/${file}); });

const startSock = async () => { const { state, saveCreds } = await useMultiFileAuthState("auth"); const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({ version, logger: pino({ level: "silent" }), printQRInTerminal: true, auth: state, browser: ['THUGKEED-XMD','Bot','1.0.0'] });

sock.ev.on("messages.upsert", async ({ messages }) => { const m = messages[0]; if (!m.message || m.key.fromMe) return; const sender = m.key.remoteJid;

let body = m.message.conversation || m.message.extendedTextMessage?.text || "";
if (!body.startsWith("!")) return;

const cmd = body.slice(1).split(" ")[0].toLowerCase();
if (commands[cmd]) commands[cmd](sock, m, sender);

});

sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", ({ connection, lastDisconnect }) => { if (connection === "close") { if ((lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut) { startSock(); } else console.log("Connection closed. You are logged out."); } }); }; startSock();


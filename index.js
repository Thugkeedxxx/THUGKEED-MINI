const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@adiwajshing/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

const commands = new Map();

// Load commands dynamically from commands folder
const commandsPath = path.join(__dirname, "commands");
fs.readdirSync(commandsPath).forEach((file) => {
  if (file.endsWith(".js")) {
    const command = require(path.join(commandsPath, file));
    commands.set(command.name, command);
  }
});

const authFolder = "./auth_info";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  // Fetch latest WhatsApp version to avoid issues
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA version v${version.join(".")} - isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true, // Show QR in console for first-time auth
    auth: state,
    browser: ["THUGKEED-XMD", "Safari", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        console.log(
          "Logged out from WhatsApp, deleting auth info and restarting..."
        );
        fs.rmSync(authFolder, { recursive: true, force: true });
      }
      console.log("Connection closed, reconnecting...");
      startBot();
    } else if (connection === "open") {
      console.log("Successfully connected to WhatsApp!");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    try {
      if (!m.messages || m.type !== "notify") return;
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const messageType = Object.keys(msg.message)[0];
      if (!["conversation", "extendedTextMessage", "imageMessage"].includes(messageType))
        return;

      // Extract text message content
      let text = "";
      if (messageType === "conversation") text = msg.message.conversation;
      else if (messageType === "extendedTextMessage")
        text = msg.message.extendedTextMessage.text;
      else if (messageType === "imageMessage")
        text = msg.message.imageMessage.caption || "";

      if (!text.startsWith("!")) return;

      const commandName = text.slice(1).trim().split(" ")[0].toLowerCase();

      if (commands.has(commandName)) {
        // Send typing indicator before executing command
        await sock.sendPresenceUpdate("composing", msg.key.remoteJid);

        // Execute the command
        await commands.get(commandName).execute(sock, msg);

        // Stop typing indicator
        await sock.sendPresenceUpdate("paused", msg.key.remoteJid);
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Unknown command: *${commandName}*\nType !menu to see the list of commands.`,
        });
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });
}

startBot();

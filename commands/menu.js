const { BOT_NAME, CHANNEL_LINK } = require("../config");

module.exports = {
  name: "menu",
  description: "Shows all available bot commands",
  async execute(client, message) {
    const reply = `
┏━━━━━━━━━━━━━━━━━┓
┃ 📜 *${BOT_NAME} COMMAND MENU*
┗━━━━━━━━━━━━━━━━━┛

🧩 Basic Commands:
• !start – Activate bot
• !menu – Show this menu
• !help – Get usage help
• !owner – Contact the owner
• !repo – GitHub source code

🎧 Media Tools:
• !music [YouTube URL] – Show MP3 info
• !sticker – Turn an image into a sticker

🔗 Stay updated:
${CHANNEL_LINK}

Type any command to get started 💥
    `;
    
    await client.sendMessage(message.key.remoteJid, { text: reply });
  }
};

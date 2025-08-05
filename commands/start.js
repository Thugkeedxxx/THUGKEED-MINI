const { BOT_NAME, OWNER_NAME, CHANNEL_LINK } = require("../config");

module.exports = {
  name: "start",
  description: "Start the bot and display a welcome message.",
  async execute(client, message) {
    const reply = `
┏━━━━━━━━━━━━━━━━━━━┓
┃  🤖 *${BOT_NAME}* ACTIVATED
┗━━━━━━━━━━━━━━━━━━━┛

👋 Hello! I'm *${BOT_NAME}*, created by *${OWNER_NAME}*.

✨ Type *!menu* to see available commands.
🔗 Channel: ${CHANNEL_LINK}
    `;
    
    await client.sendMessage(message.key.remoteJid, { text: reply });
  }
};

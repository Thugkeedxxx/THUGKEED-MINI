const ytdl = require("ytdl-core");
const { MessageType } = require("@adiwajshing/baileys");

module.exports = {
  name: "music",
  description: "Download music from YouTube link (MP3)",
  async execute(client, message) {
    try {
      const text = message.message.conversation || message.message.extendedTextMessage?.text;
      const args = text.split(" ").slice(1);
      if (args.length === 0) {
        return client.sendMessage(message.key.remoteJid, { text: "❌ Please provide a YouTube link after !music command." }, { quoted: message });
      }
      const url = args[0];
      if (!ytdl.validateURL(url)) {
        return client.sendMessage(message.key.remoteJid, { text: "❌ Invalid YouTube URL." }, { quoted: message });
      }

      // Simulate typing
      await client.sendPresenceUpdate("composing", message.key.remoteJid);

      // Get video info
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const lengthSec = info.videoDetails.lengthSeconds;

      // Fake loading animation
      await client.sendMessage(message.key.remoteJid, { text: `🎵 Fetching music: *${title}*\n⏳ Please wait...` }, { quoted: message });

      // For demo, we just send info text (YouTube To MP3 needs more backend)
      await new Promise(r => setTimeout(r, 4000));

      await client.sendMessage(message.key.remoteJid, {
        text: `✅ Ready to download:\n*${title}*\nDuration: ${Math.floor(lengthSec/60)}:${lengthSec%60 < 10 ? '0'+lengthSec%60 : lengthSec%60} min\n\n*Note:* Downloading real MP3 requires backend. This is a demo.`,
      }, { quoted: message });

      await client.sendPresenceUpdate("paused", message.key.remoteJid);
    } catch (e) {
      console.error(e);
      await client.sendMessage(message.key.remoteJid, { text: "❌ Failed to process the music command." }, { quoted: message });
    }
  }
};

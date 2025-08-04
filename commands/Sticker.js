const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
  name: "sticker",
  description: "Convert image to sticker",
  async execute(client, message) {
    try {
      // Check if message has image
      const messageType = Object.keys(message.message)[0];
      let buffer;
      if (messageType === "imageMessage") {
        buffer = message.message.imageMessage?.jpegThumbnail || null;
      } else if (messageType === "extendedTextMessage" && message.message.extendedTextMessage.contextInfo) {
        const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage;
        if (quoted && quoted.imageMessage) {
          const msgId = message.message.extendedTextMessage.contextInfo.stanzaId;
          buffer = await client.downloadMediaMessage(message.message.extendedTextMessage.contextInfo);
        }
      }

      if (!buffer) {
        return client.sendMessage(message.key.remoteJid, { text: "⚠️ Please send or quote an image with the !sticker command." }, { quoted: message });
      }

      await client.sendPresenceUpdate("composing", message.key.remoteJid);

      // Save buffer temporarily
      const tempImage = path.join(__dirname, "../tmp", `${Date.now()}.jpg`);
      const tempSticker = path.join(__dirname, "../tmp", `${Date.now()}.webp`);

      fs.writeFileSync(tempImage, buffer);

      // Convert to webp sticker using ffmpeg
      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${tempImage} -vcodec libwebp -filter:v fps=fps=15 -lossless 1 -preset default -an -vsync 0 -s 512:512 ${tempSticker}`, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const stickerData = fs.readFileSync(tempSticker);

      // Send sticker
      await client.sendMessage(message.key.remoteJid, { sticker: stickerData }, { quoted: message });

      // Clean temp files
      fs.unlinkSync(tempImage);
      fs.unlinkSync(tempSticker);

      await client.sendPresenceUpdate("paused", message.key.remoteJid);

    } catch (err) {
      console.error(err);
      await client.sendMessage(message.key.remoteJid, { text: "❌ Failed to create sticker." }, { quoted: message });
    }
  }
};

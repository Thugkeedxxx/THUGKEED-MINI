const ytdl = require('ytdl-core');
const fs = require('fs');

module.exports = async (sock, m, sender) => {
  const text = m.message.conversation || m.message.extendedTextMessage?.text;
  const url = text.split(' ')[1];
  const tempFile = `./temp_${Date.now()}.mp4`;

  if (!url || !ytdl.validateURL(url)) {
    return sock.sendMessage(sender, { text: '❌ Invalid YouTube link. Example: `!ytmp4 https://youtube.com/watch?v=...`' });
  }

  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title;

  sock.sendMessage(sender, { text: `🎬 Downloading: *${title}*...` });

  const stream = ytdl(url, { quality: '18' }); // 360p

  const file = fs.createWriteStream(tempFile);
  stream.pipe(file);

  file.on('finish', async () => {
    try {
      await sock.sendMessage(sender, {
        video: fs.readFileSync(tempFile),
        mimetype: 'video/mp4'
      });
    } catch {
      await sock.sendMessage(sender, { text: '❌ Error sending MP4. Might be too big.' });
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  file.on('error', async () => {
    await sock.sendMessage(sender, { text: '❌ Error downloading video.' });
  });
};

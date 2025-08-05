const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async (sock, m, sender) => {
  const text = m.message.conversation || m.message.extendedTextMessage?.text;
  const url = text.split(' ')[1];
  const tempFile = `./temp_${Date.now()}.mp3`;

  if (!url || !ytdl.validateURL(url)) {
    return sock.sendMessage(sender, { text: '❌ Invalid URL. Example: `!ytmp3 https://youtube.com/watch?v=...`' });
  }

  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title;

  sock.sendMessage(sender, { text: `🎵 Downloading: *${title}*...` });

  ffmpeg(ytdl(url, { quality: 'highestaudio' }))
    .audioBitrate(96)
    .save(tempFile)
    .on('end', async () => {
      await sock.sendMessage(sender, {
        audio: fs.readFileSync(tempFile),
        mimetype: 'audio/mp4'
      });
      fs.unlinkSync(tempFile);
    })
    .on('error', async () => {
      await sock.sendMessage(sender, { text: '❌ Failed to download or convert audio.' });
    });
};

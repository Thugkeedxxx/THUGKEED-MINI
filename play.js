const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'play',
  description: 'Download and send a song from YouTube',
  async execute(sock, from, args) {
    if (!args.length) return sock.sendMessage(from, { text: '❌ Please provide a song name. Usage: !play Desiigner Panda' });

    const searchResult = await yts(args.join(' '));
    const song = searchResult.videos[0];
    if (!song) return sock.sendMessage(from, { text: '❌ Song not found!' });

    const filePath = path.join(__dirname, `../temp/${song.title}.mp3`);
    const stream = ytdl(song.url, { filter: 'audioonly' });
    stream.pipe(fs.createWriteStream(filePath))
      .on('finish', async () => {
        const media = fs.readFileSync(filePath);
        await sock.sendMessage(from, {
          audio: media,
          mimetype: 'audio/mp4',
          ptt: false,
          contextInfo: { externalAdReply: { title: 'THUGKEED-LITE-MD' } }
        });
        fs.unlinkSync(filePath);
      })
      .on('error', async () => {
        await sock.sendMessage(from, { text: '❌ Error processing song.' });
      });
  }
};

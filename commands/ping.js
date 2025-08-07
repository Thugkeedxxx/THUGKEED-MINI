module.exports = {
  name: 'ping',
  description: 'Check if bot is alive',
  async execute(sock, from) {
    await sock.sendMessage(from, { text: '🏓 Pong! THUGKEED-LITE-MD is alive.' });
  }
};

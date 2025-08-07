const config = require('../config');

module.exports = {
  name: 'menu',
  description: 'Show command menu',
  async execute(sock, from) {
    const text = `🤖 *THUGKEED-LITE-MD Commands*\n
• ${config.prefix}ping
• ${config.prefix}owner
• ${config.prefix}play <song name>
• ${config.prefix}quote
• ${config.prefix}groupinfo`;

    await sock.sendMessage(from, { text });
  }
};

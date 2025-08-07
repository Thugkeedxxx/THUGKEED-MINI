const config = require('../config');

module.exports = {
  name: 'owner',
  description: 'Show owner contact',
  async execute(sock, from) {
    await sock.sendMessage(from, { text: `👑 Owner: ${config.ownerContact}` });
  }
};

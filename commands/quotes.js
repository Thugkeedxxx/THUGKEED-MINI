const axios = require('axios');

module.exports = {
  name: 'quote',
  description: 'Get a random quote',
  async execute(sock, from) {
    try {
      const response = await axios.get('https://api.quotable.io/random');
      const quote = response.data;
      await sock.sendMessage(from, { text: `💬 *${quote.content}*\n— ${quote.author}` });
    } catch {
      await sock.sendMessage(from, { text: '❌ Failed to fetch quote.' });
    }
  }
};

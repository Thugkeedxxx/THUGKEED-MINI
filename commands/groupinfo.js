module.exports = {
  name: 'groupinfo',
  description: 'Show info about the current group',
  async execute(sock, from, msg) {
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' });
    }
    const metadata = await sock.groupMetadata(from);
    const groupInfo = `📛 *Group:* ${metadata.subject}\n👥 *Participants:* ${metadata.participants.length}\n🆔 *ID:* ${metadata.id}`;
    await sock.sendMessage(from, { text: groupInfo });
  }
};

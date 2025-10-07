export default {
  name: "ping",
  description: "Test bot response speed",
  async execute(sock, msg) {
    const start = Date.now();

    // Send initial ping message
    const sent = await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pinging..." });

    // Calculate the delay
    const ping = Date.now() - start;

    // Edit or send a new message with actual speed
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🏓 *Pong!*\n⚡ *Response Speed:* ${ping} ms\n🤖 *Status:* Online ✅`
    });
  },
};

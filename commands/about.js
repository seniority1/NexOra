export default {
  name: "about",
  async execute(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "🤖 *NoxOra v1.0*\nCreated by Seniority Team 💡\nPowered by Baileys ⚙️",
    });
  },
};

export default {
  name: "getgc",
  description: "📌 Get the Group JID where the command is used",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    // 🛑 Only works in groups
    if (!from.endsWith("@g.us")) {
      await sock.sendMessage(from, { text: "❌ This command only works in groups." }, { quoted: msg });
      return;
    }

    const jid = from;

    await sock.sendMessage(from, {
      text: `📌 *Group JID:*\n\`\`\`${jid}\`\`\``
    }, { quoted: msg });
  },
};

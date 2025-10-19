export default {
  name: "myjid",
  description: "Show your WhatsApp JID",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    // 🧠 Detect sender (works for private and group)
    const sender = msg.key.participant || msg.key.remoteJid;

    // 🧩 Try to extract @lid (device JID) if available
    let jid = sender;

    if (msg.key?.id && msg.key.id.includes("::")) {
      const [possibleJid] = msg.key.id.split("::");
      if (possibleJid.includes("@lid")) jid = possibleJid;
    }

    // 🧰 Normalize JID (make sure it has domain)
    if (!jid.includes("@")) jid = `${jid}@s.whatsapp.net`;

    // 💬 Send result
    await sock.sendMessage(from, {
      text: `🪪 *Your JID:*\n\`\`\`${jid}\`\`\``
    }, { quoted: msg });
  },
};

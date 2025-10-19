import { isOwner } from "../utils/isOwner.js";

export default {
  name: "myjid",
  description: "Show your WhatsApp JID (owner only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Only owners can use this command
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only bot owners can use this command." });
    }

    // Format the sender JID
    const jid = sender.endsWith("@lid") || sender.endsWith("@s.whatsapp.net")
      ? sender
      : `${sender}@s.whatsapp.net`;

    await sock.sendMessage(from, {
      text: `👑 *Your JID:*\n\`\`\`${jid}\`\`\``
    });
  },
};

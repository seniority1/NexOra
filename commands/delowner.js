import { isOwner, delOwner } from "../utils/isOwner.js";

export default {
  name: "delowner",
  description: "Remove an owner permanently (owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Only existing owners can delete others
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only bot owners can use this command." });
    }

    const jid = args[0];
    if (!jid) {
      return sock.sendMessage(from, { text: "⚠️ Usage: .delowner 234xxx@s.whatsapp.net or 234xxx@lid" });
    }

    delOwner(jid);
    await sock.sendMessage(from, { text: `✅ Removed owner: ${jid}` });
  },
};

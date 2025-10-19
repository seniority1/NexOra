import { addOwner, isOwner } from "../utils/isOwner.js";

export default {
  name: "addowner",
  description: "Add a new bot owner permanently",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const number = args[0];

    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only the current owner can add new owners." });
    }

    if (!number) {
      return sock.sendMessage(from, { text: "⚠️ Usage: .addowner 234xxxxxxxxx" });
    }

    const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;

    addOwner(jid);
    await sock.sendMessage(from, { text: `✅ ${jid} added as a permanent owner.` });
  },
};

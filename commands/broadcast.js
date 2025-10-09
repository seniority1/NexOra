import { isOwner } from "../utils/isOwner.js";

export default {
  name: "broadcast",
  description: "Send a message to all chats (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    // ✅ Get message to broadcast
    const broadcastMessage = args.join(" ");
    if (!broadcastMessage) {
      return sock.sendMessage(
        from,
        { text: "⚠️ Please provide a message to broadcast.\n\nUsage: *.broadcast Hello everyone!*" },
        { quoted: msg }
      );
    }

    try {
      // ✅ Fetch all chats
      const chats = await sock.fetchChats();
      const chatIds = chats.map(c => c.id);

      // ✅ Send message to each chat
      for (const id of chatIds) {
        await sock.sendMessage(id, { text: broadcastMessage });
      }

      await sock.sendMessage(from, { text: `✅ Broadcast sent to ${chatIds.length} chats.` }, { quoted: msg });
    } catch (err) {
      console.error("Broadcast error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to send broadcast." }, { quoted: msg });
    }
  },
};

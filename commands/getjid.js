export default {
  name: "getjid",
  description: "📡 Get the JID and info of a channel or chat.",
  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;

      // Check if message came from a Channel (newsletter)
      const isChannel = from.endsWith("@newsletter");
      const chat = await sock.groupMetadata(from).catch(() => null); // Try to get metadata if it's a group

      let reply = "";

      if (isChannel) {
        // 📰 Channel Info
        reply = `🪪 *Channel Info*\n\n📡 *JID:* ${from}\n🧾 *Type:* Channel\n💬 *Name:* ${
          msg.pushName || "Unknown"
        }\n\nUse this JID in your forwardedNewsletterMessageInfo.`;
      } else if (chat) {
        // 👥 Group Info
        reply = `👥 *Group Info*\n\n📡 *JID:* ${from}\n🧾 *Name:* ${chat.subject}\n👤 *Members:* ${chat.participants.length}`;
      } else {
        // 💬 DM Info
        reply = `💬 *Chat Info*\n\n📡 *JID:* ${from}\n🧾 *Type:* Private Chat\n👤 *User:* ${
          msg.pushName || "Unknown"
        }`;
      }

      await sock.sendMessage(from, {
        text: reply,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363417002426604@newsletter",
            newsletterName: "𝐍𝐈𝐆𝐇𝐓-𝐇𝐎𝐖𝐋𝐄𝐑....!!™",
            serverMessageId: -1,
          },
        },
      });
    } catch (err) {
      console.error("❌ getjid command error:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Failed to get JID info.",
      });
    }
  },
};

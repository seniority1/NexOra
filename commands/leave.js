export default {
  name: "leave",
  description: "Owner-only command to make the bot leave a group",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Replace this with your WhatsApp number (including @s.whatsapp.net)
    const ownerNumber = "2348012345678@s.whatsapp.net"; // 👈 Edit this

    // Check if user is the owner
    if (sender !== ownerNumber) {
      return sock.sendMessage(from, { text: "❌ This command is for *Owner only!*" }, { quoted: msg });
    }

    // Check if it's a group
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, { text: "👋 NexOra is leaving the group..." }, { quoted: msg });
      await sock.groupLeave(from);
    } catch (err) {
      console.error("❌ Leave command error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to leave the group." }, { quoted: msg });
    }
  },
};
++

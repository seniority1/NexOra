export default {
  name: "save",
  description: "Save any message (text, media, etc.) privately to your DM",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const userJid = msg.key.participant || msg.key.remoteJid;

    // ✅ Identify the message being saved (reply or mention)
    const quoted = msg.message?.extendedTextMessage?.contextInfo;

    if (!quoted) {
      return sock.sendMessage(from, { text: "⚠️ Reply to the message you want to *save*." }, { quoted: msg });
    }

    const quotedMsgKey = {
      remoteJid: from,
      id: quoted.stanzaId,
      participant: quoted.participant || from,
    };

    try {
      // 📨 Load the full quoted message
      const savedMsg = await sock.loadMessage(quotedMsgKey.remoteJid, quotedMsgKey.id);

      if (!savedMsg) {
        return sock.sendMessage(from, { text: "❌ Failed to fetch the quoted message." }, { quoted: msg });
      }

      // 🏷️ Build header text for context
      const groupInfo = from.endsWith("@g.us") ? await sock.groupMetadata(from) : null;
      const groupName = groupInfo ? groupInfo.subject : "Private Chat";
      const time = new Date().toLocaleString();

      const header = `💾 *Saved Message*\n👥 From: ${groupName}\n🕒 ${time}\n\n`;

      // 📨 Forward or copy message to user's DM silently
      await sock.sendMessage(userJid, { text: header });

      await sock.sendMessage(userJid, {
        forward: quotedMsgKey,
      });

      // ✨ Optional silent confirmation in group (can be skipped if you want it 100% silent)
      // await sock.sendMessage(from, { text: "✅ Message saved to your DM." }, { quoted: msg });

    } catch (err) {
      console.error("Save command error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to save the message." }, { quoted: msg });
    }
  },
};

export default {
  name: "info",
  description: "Show group or user information",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";

    try {
      // 🧠 Group Info
      if (from.endsWith("@g.us")) {
        const metadata = await sock.groupMetadata(from);

        const groupName = metadata.subject;
        const groupId = metadata.id;
        const creationDate = new Date(metadata.creation * 1000).toLocaleString();
        const owner = metadata.owner || "Unknown";
        const members = metadata.participants.length;
        const adminCount = metadata.participants.filter(p => p.admin !== null).length;

        const infoText = `
┏━━📌 *${botName.toUpperCase()} INFO* ━━┓
         📝 *GROUP INFORMATION*

🏷️ *Name:* ${groupName}
🆔 *ID:* ${groupId}
👑 *Owner:* ${owner}
👥 *Members:* ${members}
🛡️ *Admins:* ${adminCount}
📅 *Created:* ${creationDate}

━━━━━━━━━━━━━━━━━━━━━━━
💡 Use *.menu* to view more commands.
┗━━━━━━━━━━━━━━━━━━━━┛
        `;

        await sock.sendMessage(
          from,
          { text: infoText.trim(), linkPreview: { renderLargerThumbnail: false } },
          { quoted: msg }
        );
      }

      // 👤 Private Chat Info
      else {
        const sender = msg.key.participant || from;
        const userInfoText = `
┏━━📌 *${botName.toUpperCase()} INFO* ━━┓
        👤 *USER INFORMATION*

🆔 *JID:* ${sender}
💬 *Chat Type:* Private

━━━━━━━━━━━━━━━━━━━━━━━
💡 Use *.menu* to view commands.
┗━━━━━━━━━━━━━━━━━━━━┛
        `;

        await sock.sendMessage(
          from,
          { text: userInfoText.trim(), linkPreview: { renderLargerThumbnail: false } },
          { quoted: msg }
        );
      }
    } catch (err) {
      console.error("❌ .info error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to fetch info." }, { quoted: msg });
    }
  },
};

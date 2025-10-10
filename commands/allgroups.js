export default {
  name: "allgroups",
  description: "📋 List all groups where the bot is a member (metadata-based)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";

    try {
      // 📌 Fetch all group metadata directly
      const groupsMetadata = await sock.groupFetchAllParticipating();
      const groups = Object.values(groupsMetadata);

      if (groups.length === 0) {
        return sock.sendMessage(from, { text: "🤖 I'm not in any groups yet." }, { quoted: msg });
      }

      // 📝 Format group list
      let groupListText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
       📋 *ALL GROUPS LIST* 📋

Total Groups: ${groups.length}

${groups
  .map(
    (g, i) =>
      `*${i + 1}.* ${g.subject || "Unnamed Group"}\n🆔 ${g.id}\n👥 Members: ${g.participants.length}`
  )
  .join("\n\n")}
┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(from, { text: groupListText.trim() }, { quoted: msg });
    } catch (err) {
      console.error("❌ allgroups error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to fetch group list." }, { quoted: msg });
    }
  },
};

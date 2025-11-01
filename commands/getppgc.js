// commands/getppgc.js
export default {
  name: "getppgc",
  description: "Get the group’s profile picture or by replying to a group link",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || "";

    // 🔍 Get group link from reply or message
    const link = quotedText.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)?.[1] ||
                 text.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)?.[1];

    try {
      let groupId;

      if (link) {
        // 🧩 If user replied with or sent a group link
        const inviteInfo = await sock.groupGetInviteInfo(link);
        groupId = inviteInfo.id;
      } else {
        // 📌 If no link, use current group
        groupId = from;
      }

      if (!groupId.endsWith("@g.us")) {
        await sock.sendMessage(from, { text: "⚠️ Please use this command inside a group or reply to a valid group link." }, { quoted: msg });
        return;
      }

      // 🖼️ Fetch the profile picture
      const ppUrl = await sock.profilePictureUrl(groupId, "image");
      await sock.sendMessage(
        from,
        { image: { url: ppUrl }, caption: "👥 Group Profile Picture" },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ getppgc error:", err);
      await sock.sendMessage(from, { text: "❌ Could not fetch the group profile picture." }, { quoted: msg });
    }
  },
};

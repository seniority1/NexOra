import { isAdmin } from "../utils/isAdmin.js";
import { bannedUsers } from "./ban.js"; // 👈 make sure bannedUsers is exported from ban.js

export default {
  name: "unban",
  description: "Unban a banned user manually (Admins only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
    }

    // ✅ Get target (mention or reply)
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      target = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
      return sock.sendMessage(from, { text: "⚠️ Tag or reply to the user you want to *unban*." }, { quoted: msg });
    }

    if (!bannedUsers[from] || !bannedUsers[from][target]) {
      return sock.sendMessage(from, { text: `ℹ️ @${target.split("@")[0]} is not banned.`, mentions: [target] }, { quoted: msg });
    }

    // 🧹 Remove ban
    delete bannedUsers[from][target];

    await sock.sendMessage(
      from,
      {
        text: `✅ @${target.split("@")[0]} has been *unbanned* and can now send messages again.`,
        mentions: [target],
      },
      { quoted: msg }
    );
  },
};

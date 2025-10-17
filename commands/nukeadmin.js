import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "nukeadmin",
  description: "Remove all admins except the bot and the executor (⚠ Admins only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const botName = "NexOra";

    // ✅ Group check
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    // ✅ Admin check
    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(from);
      const admins = metadata.participants.filter(p => p.admin === "admin" || p.admin === "superadmin");

      // Filter out the bot and the executor
      const targets = admins
        .map(a => a.id)
        .filter(id => id !== botNumber && id !== sender);

      if (targets.length === 0) {
        return sock.sendMessage(from, { text: "ℹ️ No other admins to remove." }, { quoted: msg });
      }

      // ⚠ Remove admin rights for each target
      for (const adminId of targets) {
        await sock.groupParticipantsUpdate(from, [adminId], "demote");
      }

      const text = `
┏━━💣 *${botName.toUpperCase()} BOT* ━━┓
      🚨 *NUKE ADMIN EXECUTED* 🚨

👤 *Executor:* @${sender.split("@")[0]}  
💥 *Removed Admins:* ${targets.map(id => "@" + id.split("@")[0]).join(", ")}

Only you and the bot remain as admins.
┗━━━━━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(
        from,
        { text, mentions: [sender, ...targets] },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ NukeAdmin error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to execute nukeadmin." }, { quoted: msg });
    }
  },
};

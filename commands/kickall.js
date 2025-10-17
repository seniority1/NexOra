import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "kickall",
  description: "Remove all members from the group except the bot and executor (⚠ Requires confirmation)",
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

    // 📝 Ask for confirmation
    const confirmMsg = await sock.sendMessage(
      from,
      {
        text: `⚠️ *Are you sure you want to kick everyone in this group?*  
Reply with \`y\` to confirm or \`n\` to cancel.`,
      },
      { quoted: msg }
    );

    // ✅ Wait for the admin’s reply
    const confirmation = await new Promise(resolve => {
      const timeout = setTimeout(() => resolve(null), 30000); // 30 sec

      sock.ev.on("messages.upsert", function handler(upsert) {
        const responseMsg = upsert.messages[0];
        if (
          responseMsg.key.remoteJid === from &&
          (responseMsg.key.participant || responseMsg.key.remoteJid) === sender &&
          responseMsg.message?.conversation
        ) {
          const reply = responseMsg.message.conversation.trim().toLowerCase();
          if (reply === "y" || reply === "n") {
            sock.ev.off("messages.upsert", handler);
            clearTimeout(timeout);
            resolve(reply);
          }
        }
      });
    });

    // 🟡 Handle no response / cancel
    if (confirmation !== "y") {
      return sock.sendMessage(from, { text: "❌ Kickall cancelled." }, { quoted: msg });
    }

    try {
      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants.map(p => p.id);

      // Exclude bot and executor
      const targets = participants.filter(id => id !== botNumber && id !== sender);

      if (targets.length === 0) {
        return sock.sendMessage(from, { text: "ℹ️ No members to kick." }, { quoted: msg });
      }

      // 🦿 Kick each member with a short delay
      for (const memberId of targets) {
        await sock.groupParticipantsUpdate(from, [memberId], "remove");
        await new Promise(r => setTimeout(r, 400));
      }

      const text = `
┏━━🦵 *${botName.toUpperCase()} BOT* ━━┓
     🚨 *KICKALL EXECUTED* 🚨

👤 *Executor:* @${sender.split("@")[0]}  
👥 *Kicked Members:* ${targets.map(id => "@" + id.split("@")[0]).join(", ")}

Group cleaned successfully 🧼
┗━━━━━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(
        from,
        { text, mentions: [sender, ...targets] },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ KickAll error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to execute kickall." }, { quoted: msg });
    }
  },
};

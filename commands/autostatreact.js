import { isOwner } from "../utils/isOwner.js";
import { setSetting, getSetting } from "../utils/settings.js";

export default {
  name: "autostatreact",
  description: "Toggle automatic 💚 reaction to viewed statuses (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botName = "NexOra";

    // 🧠 Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "🚫 Only the owner can use this command." }, { quoted: msg });
    }

    const action = args[0]?.toLowerCase();
    if (!["on", "off"].includes(action)) {
      return sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
💚 *Auto Status React (Owner Only)*

📘 Usage:
• *.autostatreact on*
• *.autostatreact off*
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    }

    const enabled = action === "on";

    // 💾 Save to global key instead of per-group
    setSetting("global", { autostatreact: enabled });

    await sock.sendMessage(
      from,
      {
        text: `💚 Auto status reaction has been *${enabled ? "ENABLED ✅" : "DISABLED ❌"}*`,
      },
      { quoted: msg }
    );
  },
};

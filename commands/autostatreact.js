import fs from "fs";
import { isOwner } from "../utils/isOwner.js";

const SETTINGS_FILE = "./settings.json";

function getSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

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

    // ⚙️ Read & update settings
    const settings = getSettings();
    settings.autostatreact = action === "on";
    saveSettings(settings);

    await sock.sendMessage(
      from,
      {
        text: `💚 Auto status reaction has been *${settings.autostatreact ? "ENABLED ✅" : "DISABLED ❌"}*`,
      },
      { quoted: msg }
    );
  },
};

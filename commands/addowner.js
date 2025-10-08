import fs from "fs";
import config from "../config.js";
import { isOwner } from "../utils/isOwner.js";

export default {
  name: "addowner",
  description: "Add a new owner (Owner only)",
  async execute(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!isOwner(sender)) {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Only current owner can add new owners!" }, { quoted: msg });
      return;
    }

    const text = msg.message?.conversation?.split(" ")[1];
    if (!text) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Example: `.addowner 2349012345678`" }, { quoted: msg });
      return;
    }

    if (config.owners.includes(text)) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ This number is already an owner!" }, { quoted: msg });
      return;
    }

    config.owners.push(text);
    fs.writeFileSync("./config.js", `export default ${JSON.stringify(config, null, 2)};\n`);

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Added new owner: ${text}` }, { quoted: msg });
  },
};

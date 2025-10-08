import fs from "fs";
import config from "../config.js";
import { isOwner } from "../utils/isOwner.js";

export default {
  name: "removeowner",
  description: "Remove an existing owner (Owner only)",
  async execute(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!isOwner(sender)) {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Only owner can remove another owner!" }, { quoted: msg });
      return;
    }

    const text = msg.message?.conversation?.split(" ")[1];
    if (!text) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Example: `.removeowner 2349012345678`" }, { quoted: msg });
      return;
    }

    const index = config.owners.indexOf(text);
    if (index === -1) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ That number is not an owner!" }, { quoted: msg });
      return;
    }

    config.owners.splice(index, 1);
    fs.writeFileSync("./config.js", `export default ${JSON.stringify(config, null, 2)};\n`);

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Removed owner: ${text}` }, { quoted: msg });
  },
};

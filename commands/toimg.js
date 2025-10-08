import { writeFileSync, unlinkSync } from "fs";
import { randomBytes } from "crypto";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "toimg",
  description: "Convert sticker to image",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted?.stickerMessage) {
      return sock.sendMessage(from, { text: "📌 *Reply to a sticker with `.toimg`*" }, { quoted: msg });
    }

    try {
      const buffer = await downloadMediaMessage(
        { message: quoted },
        "buffer",
        {},
        { logger: console }
      );

      const filePath = `./${randomBytes(5).toString("hex")}.png`;
      writeFileSync(filePath, buffer);

      const replyText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
       🖼️ *Sticker → Image* 🖼️
┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(from, {
        image: { url: filePath },
        caption: replyText.trim(),
      }, { quoted: msg });

      unlinkSync(filePath);
    } catch (e) {
      await sock.sendMessage(from, { text: "⚠️ Failed to convert sticker to image." }, { quoted: msg });
    }
  },
};

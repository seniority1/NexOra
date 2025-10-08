import { writeFileSync, unlinkSync } from "fs";
import { randomBytes } from "crypto";
import { exec } from "child_process";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "sticker",
  description: "Convert image or video to sticker",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const isMedia = quoted?.imageMessage || quoted?.videoMessage;

    if (!isMedia) {
      return sock.sendMessage(from, { text: "🖼️ *Reply to an image or short video with `.sticker`*" }, { quoted: msg });
    }

    try {
      const buffer = await downloadMediaMessage(
        { message: quoted },
        "buffer",
        {},
        { logger: console }
      );

      const inputPath = `./${randomBytes(5).toString("hex")}`;
      const outputPath = `./${randomBytes(5).toString("hex")}.webp`;

      writeFileSync(inputPath, buffer);

      // 🧠 Convert to sticker using ffmpeg (for both image & video)
      const cmd = quoted.videoMessage
        ? `ffmpeg -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white" -loop 0 -ss 0 -t 8 -an -vsync 0 -c:v libwebp -preset picture -q:v 50 ${outputPath}`
        : `ffmpeg -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white" -c:v libwebp -preset picture -q:v 50 ${outputPath}`;

      exec(cmd, async (err) => {
        unlinkSync(inputPath);
        if (err) {
          return sock.sendMessage(from, { text: "⚠️ Failed to convert media to sticker." }, { quoted: msg });
        }

        await sock.sendMessage(
          from,
          {
            sticker: { url: outputPath },
          },
          { quoted: msg }
        );

        unlinkSync(outputPath);
      });
    } catch (e) {
      await sock.sendMessage(from, { text: "❌ Something went wrong converting to sticker." }, { quoted: msg });
    }
  },
};

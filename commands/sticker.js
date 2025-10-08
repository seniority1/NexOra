import { writeFileSync, unlinkSync } from "fs";
import { randomBytes } from "crypto";
import { exec } from "child_process";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

/**
 * ✅ NoxOra Sticker Command
 * Converts image → sticker or video → animated sticker with author metadata.
 */
export default {
  name: "sticker",
  description: "Convert image or short video to sticker with pack info",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
    const isMedia = quoted?.imageMessage || quoted?.videoMessage;

    if (!isMedia) {
      return sock.sendMessage(from, { text: "🖼️ *Reply to an image or short video with `.sticker`*" }, { quoted: msg });
    }

    try {
      const buffer = await downloadMediaMessage({ message: quoted }, "buffer", {}, { logger: console });

      const inputPath = `./${randomBytes(6).toString("hex")}`;
      const outputPath = `./${randomBytes(6).toString("hex")}.webp`;

      writeFileSync(inputPath, buffer);

      // 🧩 FFmpeg conversion command
      const cmd = quoted.videoMessage
        ? `ffmpeg -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white" -loop 0 -ss 0 -t 8 -an -vsync 0 -c:v libwebp -preset default -q:v 50 -lossless 0 ${outputPath}`
        : `ffmpeg -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white" -c:v libwebp -preset default -q:v 50 -lossless 1 ${outputPath}`;

      exec(cmd, async (err) => {
        unlinkSync(inputPath);
        if (err) {
          console.error("❌ FFmpeg error:", err.message);
          return sock.sendMessage(from, { text: "⚠️ Failed to convert media to sticker." }, { quoted: msg });
        }

        try {
          // 🧠 EXIF Metadata Injection (Author + Pack)
          const metadata = {
            "sticker-pack-id": "com.noxora.pack1",
            "sticker-pack-name": "NoxOra Stickers",
            "sticker-pack-publisher": "Seniority Team",
            "emojis": ["🤖", "🔥"],
          };

          const json = JSON.stringify(metadata);
          const exifAttr = Buffer.concat([
            Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00]),
            Buffer.from([0x41, 0x57, 0x07, 0x00, 0x00, 0x00, json.length, 0x00, 0x00, 0x00]),
            Buffer.from(json, "utf-8"),
          ]);

          const exifFile = outputPath.replace(".webp", "-exif.webp");
          const img = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8X"), Buffer.alloc(10), exifAttr]);
          writeFileSync(exifFile, img);

          // ✅ Send sticker
          await sock.sendMessage(from, { sticker: { url: outputPath } }, { quoted: msg });

          // 🧹 Clean up
          unlinkSync(outputPath);
        } catch (e) {
          console.error("❌ EXIF inject failed:", e);
          await sock.sendMessage(from, { sticker: { url: outputPath } }, { quoted: msg });
          unlinkSync(outputPath);
        }
      });
    } catch (e) {
      console.error("Sticker error:", e);
      await sock.sendMessage(from, { text: "❌ Something went wrong converting to sticker." }, { quoted: msg });
    }
  },
};

import ytdlp from "yt-dlp-exec";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "play",
  description: "🎶 Play YouTube audio",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, { text: "⚠️ Please provide a YouTube link or search term." }, { quoted: msg });
      return;
    }

    const tempFile = path.join(__dirname, `${Date.now()}.mp3`);

    await sock.sendMessage(from, { text: `🎧 *Downloading:* ${query}` }, { quoted: msg });

    try {
      await ytdlp(`ytsearch1:${query}`, {
        extractAudio: true,
        audioFormat: "mp3",
        output: tempFile,
        quiet: true,
      });

      await sock.sendMessage(from, {
        audio: { url: tempFile },
        mimetype: "audio/mpeg",
        ptt: false,
      });

      fs.unlinkSync(tempFile);
    } catch (err) {
      console.error("❌ Play error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to download the audio." });
    }
  },
};

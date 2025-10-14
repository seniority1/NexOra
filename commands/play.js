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

    // Save MP3 temporarily
    const tempFile = path.join(__dirname, `${Date.now()}.mp3`);

    await sock.sendMessage(from, { text: `🎧 *Downloading:* ${query}` }, { quoted: msg });

    try {
      // Run yt-dlp through exec wrapper
      await ytdlp(`ytsearch1:${query}`, {
        extractAudio: true,
        audioFormat: "mp3",
        audioQuality: "0", // best
        output: tempFile,
        quiet: true,
        preferFfmpeg: true,
      });

      // Send as audio
      await sock.sendMessage(from, {
        audio: { url: tempFile },
        mimetype: "audio/mpeg",
        ptt: false,
      });

      // Delete after sending
      fs.unlinkSync(tempFile);
    } catch (err) {
      console.error("❌ Play error:", err);
      await sock.sendMessage(from, {
        text: "❌ Failed to download or play the audio.\n\n> Check if yt-dlp is properly installed.",
      });
    }
  },
};

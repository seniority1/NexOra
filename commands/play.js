import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import ytdlp from "yt-dlp-exec";

export default {
  name: "play",
  description: "🎶 Play or download YouTube audio by search query",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, { text: "⚠️ Please provide a song name or YouTube link.\n\nExample: `.play Davido Feel`" });
      return;
    }

    // 📁 Build temporary file path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outputFile = path.join(__dirname, `../temp-${Date.now()}.mp3`);

    await sock.sendMessage(from, { text: `🔎 Searching & downloading: *${query}* ...` });

    try {
      // 🧠 Use yt-dlp to search and download first result as mp3
      await ytdlp(`ytsearch1:${query}`, {
        extractAudio: true,
        audioFormat: "mp3",
        output: outputFile,
        quiet: true,
      });

      // ✅ Send audio file
      const audioBuffer = fs.readFileSync(outputFile);
      await sock.sendMessage(from, {
        audio: audioBuffer,
        mimetype: "audio/mp4",
        ptt: false, // set true if you want it as voice note
        fileName: `${query}.mp3`,
      });

    } catch (err) {
      console.error("❌ .play error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to download audio. Try another keyword." });
    } finally {
      // 🧹 Clean up temp file
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }
    }
  },
};

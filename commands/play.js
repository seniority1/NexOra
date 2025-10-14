import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "play",
  description: "🎶 Download and play YouTube audio",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, { text: "⚠️ Please provide a song name or YouTube URL." }, { quoted: msg });
      return;
    }

    const tempFile = path.join(__dirname, `${Date.now()}.mp3`);

    // Inform user
    await sock.sendMessage(from, { text: `🎧 *Searching and downloading:* ${query} ...` }, { quoted: msg });

    // 🔍 Check if yt-dlp is installed
    exec("yt-dlp --version", (checkErr) => {
      if (checkErr) {
        sock.sendMessage(from, {
          text: "❌ *yt-dlp not found.*\nPlease make sure it's installed correctly in your environment.",
        });
        return;
      }

      // 🛠️ Download audio
      const cmd = `yt-dlp -x --audio-format mp3 -o "${tempFile}" "ytsearch1:${query}"`;
      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Download error:", error);
          await sock.sendMessage(from, { text: "❌ Failed to download the audio. Try a different song or check the URL." });
          return;
        }

        // 🧪 Check if file was created
        if (!fs.existsSync(tempFile)) {
          await sock.sendMessage(from, { text: "❌ Download failed — file not found after download." });
          return;
        }

        // ✅ Send the audio file
        try {
          await sock.sendMessage(from, {
            audio: { url: tempFile },
            mimetype: "audio/mpeg",
            ptt: false,
          });
        } catch (sendErr) {
          console.error("❌ Send error:", sendErr);
          await sock.sendMessage(from, { text: "❌ Failed to send the audio file." });
        } finally {
          // 🧹 Clean up temp file
          fs.unlink(tempFile, (delErr) => {
            if (delErr) console.error("⚠️ Failed to delete temp file:", delErr);
          });
        }
      });
    });
  },
};

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// For __dirname in ES modules
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

    await sock.sendMessage(from, { text: `🎧 *Searching and downloading:* ${query} ...` });

    // 🛠️ Use yt-dlp from system
    exec(
      `yt-dlp -x --audio-format mp3 -o "${tempFile}" "ytsearch1:${query}"`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Download error:", error);
          await sock.sendMessage(from, { text: "❌ Failed to download the audio." });
          return;
        }

        // ✅ Send the audio
        try {
          await sock.sendMessage(from, {
            audio: { url: tempFile },
            mimetype: "audio/mpeg",
            ptt: false, // true = send as voice note
          });

          fs.unlinkSync(tempFile); // cleanup
        } catch (err) {
          console.error("❌ Send error:", err);
          await sock.sendMessage(from, { text: "❌ Failed to send the audio." });
        }
      }
    );
  },
};

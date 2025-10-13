import { exec } from "child_process";
import fs from "fs";
import path from "path";

export default {
  name: "play",
  description: "🎶 Play songs from YouTube by searching keywords",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
      return sock.sendMessage(from, { text: "⚠️ Please provide a song name.\n\nExample: *.play Davido Funds*" }, { quoted: msg });
    }

    const tempFile = path.join(process.cwd(), `song_${Date.now()}.mp3`);

    await sock.sendMessage(from, { text: `🔍 Searching and downloading *${query}*...` }, { quoted: msg });

    // 🎧 Download with yt-dlp (best audio)
    const cmd = `yt-dlp -x --audio-format mp3 -o "${tempFile}" "ytsearch1:${query}"`;

    exec(cmd, async (error, stdout, stderr) => {
      if (error) {
        console.error("❌ yt-dlp error:", error);
        return sock.sendMessage(from, { text: "❌ Failed to download the audio." }, { quoted: msg });
      }

      // ✅ Send the audio file
      try {
        await sock.sendMessage(from, {
          audio: { url: tempFile },
          mimetype: "audio/mpeg",
          ptt: false, // set true to send as voice note
        }, { quoted: msg });

        fs.unlinkSync(tempFile); // clean up
      } catch (err) {
        console.error("❌ Error sending audio:", err);
        sock.sendMessage(from, { text: "⚠️ Error sending the file." }, { quoted: msg });
      }
    });
  }
};

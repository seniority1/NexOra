import ytdl from "ytdl-core-exec";
import axios from "axios";
import fs from "fs";

export default {
  name: "play",
  description: "Play and download YouTube music by name",
  async execute(sock, msg, args) {
    const query = args.join(" ");
    if (!query) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Please provide a song name." });
      return;
    }

    try {
      // 🔍 Search for the song on YouTube using the API
      const searchUrl = `https://ytsearch.guru/api/v1/search?query=${encodeURIComponent(query)}`;
      const res = await axios.get(searchUrl);
      const video = res.data.results[0];

      if (!video || !video.url) {
        await sock.sendMessage(msg.key.remoteJid, { text: "❌ No results found on YouTube." });
        return;
      }

      const url = video.url;
      const title = video.title || "Unknown Song";
      const file = `./temp/${title.replace(/[^\w\s]/gi, "_")}.mp3`;

      // 🎧 Download audio
      const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
      await new Promise((resolve, reject) => {
        stream.pipe(fs.createWriteStream(file))
          .on("finish", resolve)
          .on("error", reject);
      });

      // 🎶 Send audio with NexOra branding
      await sock.sendMessage(msg.key.remoteJid, {
        audio: { url: file },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
        caption: `🎵 *${title}*\n\n✨━━━『 *Powered by NexOra* 』━━━✨`
      });

      fs.unlinkSync(file);
    } catch (err) {
      console.error("❌ Play command error:", err.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to play or download the song. Try again later."
      });
    }
  }
};

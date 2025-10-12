import ytdl from "@distube/ytdl-core";
import fs from "fs";

export default {
  name: "ytdl",
  description: "🎵 Download YouTube audio",
  category: "downloader",

  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const url = args[0];

    if (!url) {
      await sock.sendMessage(from, { text: "❌ Please provide a YouTube video link." });
      return;
    }

    try {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const filePath = `/tmp/${Date.now()}.mp3`;

      const stream = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      writeStream.on("finish", async () => {
        await sock.sendMessage(from, {
          audio: { url: filePath },
          mimetype: "audio/mpeg",
          caption: `🎶 ${title}`,
        });
        fs.unlinkSync(filePath);
      });
    } catch (err) {
      console.error("❌ YouTube download error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to download YouTube audio." });
    }
  },
};

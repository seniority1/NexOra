import ytdl from "ytdl-core-exec";
import fs from "fs";

export default {
  name: "ytmp4",
  description: "Download YouTube video as MP4",
  async execute(sock, msg, args) {
    if (!args[0]) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Please provide a YouTube link." });
      return;
    }

    const url = args[0];
    try {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[\\/:*?"<>|]/g, "");

      const stream = ytdl(url, {
        filter: "audioandvideo",
        quality: "highestvideo",
      });

      const file = `./temp/${title}.mp4`;

      await new Promise((resolve, reject) => {
        stream.pipe(fs.createWriteStream(file))
          .on("finish", resolve)
          .on("error", reject);
      });

      // 🎨 Stylized “Powered by NexOra” caption
      const designs = [
        `🎥 *${title}*\n\n━━━━━━━━━━━━━━━\n⚡ 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝙉𝙚𝙭𝙊𝙧𝙖 ⚡\n━━━━━━━━━━━━━━━`,
        `🎥 *${title}*\n\n╔══✦══•❥\n🔹 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗡𝗲𝘅𝗢𝗿𝗮 🔹\n╚══✦══•❥`,
        `🎥 *${title}*\n\n✨━━━『 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝙉𝙚𝙭𝙊𝙧𝙖 』━━━✨`,
        `🎥 *${title}*\n\n🏆 *NEXORA DOWNLOADER* 🏆\n💻 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝙉𝙚𝙭𝙊𝙧𝙖`,
        `🎥 *${title}*\n\n🌀 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑵𝒆𝒙𝑶𝒓𝒂 🌀`,
      ];

      const caption = designs[Math.floor(Math.random() * designs.length)];

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: file },
        caption,
      });

      fs.unlinkSync(file);
    } catch (err) {
      console.error("❌ YouTube download error:", err.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to download YouTube video. Try another link or use `.ytmp3`.",
      });
    }
  },
};

import axios from "axios";

export default {
  name: "tiktok",
  description: "Download TikTok videos",
  async execute(sock, msg, args) {
    if (!args[0]) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Please provide a TikTok link." });
      return;
    }

    const url = args[0];

    // ✨ Fancy caption templates
    const designs = [
      `🎬 *{title}*\n\n━━━━━━━━━━━━━━━\n⚡ 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝙉𝙚𝙭𝙊𝙧𝙖 ⚡\n━━━━━━━━━━━━━━━`,
      `🎬 *{title}*\n\n╔══✦══•❥\n🔹 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗡𝗲𝘅𝗢𝗿𝗮 🔹\n╚══✦══•❥`,
      `🎬 *{title}*\n\n✨━━━『 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝙉𝙚𝙭𝙊𝙧𝙖 』━━━✨`,
      `🎬 *{title}*\n\n🏆 *NEXORA DOWNLOADER* 🏆\n💻 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝙉𝙚𝙭𝙊𝙧𝙖`,
      `🎬 *{title}*\n\n🌀 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚 𝑵𝒆𝒙𝑶𝒓𝒂 🌀`,
    ];

    // 🌀 Pick one at random
    const randomCaption = designs[Math.floor(Math.random() * designs.length)];

    try {
      const res = await axios.get(`https://tikwm.com/api/?url=${url}`);
      const data = res.data.data;
      const caption = randomCaption.replace("{title}", data.title || "TikTok Video");

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: data.play },
        caption,
      });
    } catch (err) {
      console.error("❌ TikTok download error:", err.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to download TikTok video.",
      });
    }
  }
};

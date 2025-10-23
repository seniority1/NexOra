import axios from "axios";

export default {
  name: "sora",
  description: "Generate a video from text using AI (text-to-video)",

  async execute(sock, msg, args) {
    try {
      const chatId = msg.key.remoteJid;

      // Extract user text or quoted text
      const rawText =
        msg.message?.conversation?.trim() ||
        msg.message?.extendedTextMessage?.text?.trim() ||
        msg.message?.imageMessage?.caption?.trim() ||
        msg.message?.videoMessage?.caption?.trim() ||
        "";

      const used = (rawText || "").split(/\s+/)[0] || ".sora";
      const textArgs = rawText.slice(used.length).trim();

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedText =
        quoted?.conversation || quoted?.extendedTextMessage?.text || "";

      const input = textArgs || quotedText || args.join(" ").trim();

      if (!input) {
        await sock.sendMessage(
          chatId,
          {
            text: "🪄 *Usage:* .sora <prompt>\nExample: `.sora anime girl walking in Tokyo rain`",
          },
          { quoted: msg }
        );
        return;
      }

      // ✂️ Auto-trim if too long (1000 words)
      let prompt = input.trim();
      const words = prompt.split(/\s+/);
      if (words.length > 1000) {
        prompt = words.slice(0, 1000).join(" ");
        await sock.sendMessage(
          chatId,
          {
            text: "⚠️ Your prompt was too long, so it was trimmed to 1000 words for better performance.",
          },
          { quoted: msg }
        );
      }

      // Inform user
      await sock.sendMessage(
        chatId,
        { text: "🎥 Generating your AI video, please wait..." },
        { quoted: msg }
      );

      // ✅ POST request (better for long text)
      const { data } = await axios.post(
        "https://okatsu-rolezapiiz.vercel.app/ai/txt2video",
        { text: prompt },
        {
          timeout: 60000,
          headers: { "Content-Type": "application/json" },
        }
      );

      const videoUrl =
        data?.videoUrl || data?.result || data?.data?.videoUrl;

      if (!videoUrl || !videoUrl.endsWith(".mp4")) {
        throw new Error("Invalid or missing video URL");
      }

      // 💎 WhatsApp caption formatting with quotes (blur effect)
      const caption = `🎬 *Prompt:*\n> ${prompt}\n\n> Powered by NexOra`;

      await sock.sendMessage(
        chatId,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          caption,
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error("[SORA ERROR]:", error.message);
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: "❌ Failed to generate video. Please try again later.",
        },
        { quoted: msg }
      );
    }
  },
};

import axios from "axios";

export default {
  name: "sora",
  description: "Generate a video from text using AI (text-to-video)",

  async execute(sock, msg, args) {
    try {
      const chatId = msg.key.remoteJid;
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

      await sock.sendMessage(
        chatId,
        { text: "🎥 Generating video, please wait..." },
        { quoted: msg }
      );

      // ✅ POST request supports long text safely
      const { data } = await axios.post(
        "https://okatsu-rolezapiiz.vercel.app/ai/txt2video",
        { text: input },
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

      await sock.sendMessage(
        chatId,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          caption: `🎬 *Prompt:* ${input}`,
        },
        { quoted: msg }
      );
    } catch (error) {
      console.error("[SORA ERROR]:", error.message);
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: "❌ Failed to generate video. Try again later.",
        },
        { quoted: msg }
      );
    }
  },
};

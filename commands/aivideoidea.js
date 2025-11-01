import fetch from "node-fetch";

export default {
  name: "aivideoidea",
  description: "Generate creative video ideas using AI",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(
        from,
        { text: "🎥 Usage: *.aivideoidea <topic>*\n\n💡 Example: *.aivideoidea football highlights*" },
        { quoted: msg }
      );
      return;
    }

    try {
      // 🔥 Use a creative idea generation API (OpenAI-style)
      const prompt = `Generate 5 unique and catchy YouTube/TikTok video ideas about "${query}". Each idea should be short and attention-grabbing.`;

      const response = await fetch("https://api-inference.huggingface.co/models/gpt2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt }),
      });

      const data = await response.json();
      const text = data[0]?.generated_text || "⚠️ Couldn't generate ideas right now.";

      await sock.sendMessage(
        from,
        { text: `🎬 *AI Video Ideas for:* ${query}\n\n${text.trim()}` },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ aivideoidea error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to generate video ideas. Try again later." }, { quoted: msg });
    }
  },
};

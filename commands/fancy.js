export default {
  name: "fancy",
  description: "Convert text to a fancy stylish version ✨",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "💬 Usage: `.fancy hello`" }, { quoted: msg });

    try {
      const res = await fetch(`https://api.ryzendesu.com/api/fancy?text=${encodeURIComponent(text)}`);
      const data = await res.json();

      let list = data.result.map((t, i) => `${i + 1}. ${t}`).join("\n");

      const reply = `
🎨 *Fancy Text Generator* 🎨
============================
Original: ${text}

${list}
============================
Reply with number to copy ✨
      `;
      await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
    } catch (err) {
      console.error("❌ Fancy text error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to generate fancy text." }, { quoted: msg });
    }
  },
};

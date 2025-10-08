export default {
  name: "eval",
  ownerOnly: true, // ✅ Only the owner can run this
  description: "Run JavaScript code remotely (owner only).",
  
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const code = args.join(" ");
    if (!code) {
      return await sock.sendMessage(from, { text: "⚙️ *Usage:* .eval <JavaScript code>" }, { quoted: msg });
    }

    try {
      // Evaluate safely
      let output = await eval(code);
      if (typeof output !== "string") {
        output = JSON.stringify(output, null, 2);
      }

      await sock.sendMessage(from, { text: `✅ *Result:*\n\`\`\`\n${output}\n\`\`\`` }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ *Error:*\n\`\`\`\n${err.message}\n\`\`\`` }, { quoted: msg });
    }
  }
};

export default {
  name: "carbon",
  description: "Turn code into beautiful image",
  async execute(sock, msg) {
    let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      const usageText = `
┏━━💻 *CARBON CODE IMAGE* ━━┓

Please reply to a code message!

📌 *Usage:* Reply to code with .carbon

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      return await sock.sendMessage(msg.key.remoteJid, { text: usageText }, { quoted: msg });
    }

    let code = quoted.conversation || quoted.extendedTextMessage?.text || "console.log('Hello World!');";

    const processingText = `
┏━━💻 *GENERATING CARBON* ━━┓

🎨 Creating beautiful code image...
⏳ Please wait...

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(msg.key.remoteJid, { text: processingText }, { quoted: msg });

    try {
      const carbonUrl = `https://carbonara.solopov.dev/api/cook`;
      const response = await fetch(carbonUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          backgroundColor: "#1e1e1e", // Dark theme
          theme: "dracula",
          fontFamily: "Fira Code"
        })
      });

      if (!response.ok) throw new Error("API error");

      const buffer = await response.arrayBuffer();

      const captionText = `
┏━━💻 *CARBON IMAGE* ━━┓

✅ Your code, now beautiful! ✨

Powered by Carbonara API

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(msg.key.remoteJid, {
        image: Buffer.from(buffer),
        caption: captionText
      }, { quoted: msg });

    } catch (error) {
      const errorText = `
┏━━❌ *CARBON ERROR* ━━┓

😕 Failed to generate image!

Try replying to a shorter code block.

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(msg.key.remoteJid, { text: errorText }, { quoted: msg });
    }
  },
};

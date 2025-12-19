export default {
  name: "check",
  description: "Check handsome/beautiful percentage",
  async execute(sock, msg) {
    let who = msg.key.participant || msg.key.remoteJid;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      who = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      who = msg.message.extendedTextMessage.contextInfo.participant;
    }

    try {
      let ppUrl = await sock.profilePictureUrl(who, "image");
      ppUrl = ppUrl || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";
    } catch {
      ppUrl = "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";
    }

    const percentage = Math.floor(Math.random() * 101);
    const isHigh = percentage > 70;
    const emoji = isHigh ? "😍✨" : "😅";

    const type = Math.random() > 0.5 ? "handsome" : "beautiful"; // Random for fun
    const title = type === "handsome" ? "🤴 HANDSOME CHECK" : "👸 BEAUTIFUL CHECK";

    const resultText = `
┏━━\( {emoji} * \){title}* ━━┓

✅ Result: *\( {percentage}%* \){type}!

${isHigh ? "Wow! You're stunning! 🔥" : "Still cute though! 💖"}

Powered by NexOra randomness

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(msg.key.remoteJid, {
      image: { url: ppUrl },
      caption: resultText
    }, { quoted: msg });
  },
};

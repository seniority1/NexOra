export default {
  name: "wanted",
  description: "Create a Wanted poster from profile picture",
  async execute(sock, msg) {
    let who;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      who = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      who = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
      who = msg.key.participant || msg.key.remoteJid;
    }

    const processingText = `
┏━━🔍 *WANTED POSTER* ━━┓

🤠 Generating Wanted poster...
⏳ Please wait a moment...

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: processingText },
      { quoted: msg }
    );

    try {
      // Get profile picture URL
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(who, "image");
      } catch {
        ppUrl = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
      }

      // Generate Wanted poster using free API
      const wantedApi = `https://api.lolhuman.xyz/api/wanted?apikey=yourfreekey&img=${encodeURIComponent(ppUrl)}`;
      // Note: Many bots use public endpoints without key. Alternative free one:
      const wantedUrl = `https://idn.png.api.net.id/wanted?img=${encodeURIComponent(ppUrl)}`;

      const captionText = `
┏━━🤠 *WANTED* ━━┓

💲 *REWARD: $1,000,000*
⚠️ *DEAD OR ALIVE*

🔥 Created by NexOra Bot

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      // Send the generated image
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: wantedUrl },
        caption: captionText,
      }, { quoted: msg });

    } catch (error) {
      const errorText = `
┏━━❌ *WANTED ERROR* ━━┓

😕 Failed to create Wanted poster!

Possible reasons:
• Profile picture is private
• User has no PP
• Temporary API issue

Try again or tag someone with public PP!

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: errorText },
        { quoted: msg }
      );
    }
  },
};

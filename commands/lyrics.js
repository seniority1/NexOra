export default {
  name: "lyrics",
  description: "Fetch song lyrics",
  async execute(sock, msg, args) {
    if (args.length < 2) {
      const usageText = `
┏━━🎤 *LYRICS FINDER* ━━┓

Please provide artist and song title!

📌 *Usage:* .lyrics <artist> <song title>
Example: .lyrics alan walker faded
       or: .lyrics ed sheeran perfect

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      return await sock.sendMessage(
        msg.key.remoteJid,
        { text: usageText },
        { quoted: msg }
      );
    }

    const artist = args[0];
    const title = args.slice(1).join(" ");
    const searchingText = `
┏━━🎤 *SEARCHING LYRICS* ━━┓

🎵 *Song:* ${title}
🎤 *Artist:* ${artist}
⏳ Fetching lyrics...

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: searchingText },
      { quoted: msg }
    );

    try {
      const response = await fetch(
        `https://api.lyrics.ovh/v1/\( {encodeURIComponent(artist)}/ \){encodeURIComponent(title)}`
      );
      const data = await response.json();

      if (!data.lyrics || data.lyrics.trim() === "") {
        throw new Error("No lyrics found");
      }

      const lyrics = data.lyrics.trim();

      // Split long lyrics to avoid WhatsApp message limit (~4096 chars)
      const maxLength = 3000;
      if (lyrics.length > maxLength) {
        const parts = lyrics.match(new RegExp(`.{1,\( {maxLength}}(\\n| \))`, "g"));
        for (let i = 0; i < parts.length; i++) {
          const partText = `
┏━━🎤 *LYRICS* (\( {i + 1}/ \){parts.length}) ━━┓

🎵 *\( {title}* - \){artist}

${parts[i]}

┗━━━━━━━━━━━━━━━━┛
          `.trim();

          await sock.sendMessage(msg.key.remoteJid, { text: partText }, { quoted: msg });
        }
      } else {
        const fullText = `
┏━━🎤 *LYRICS* ━━┓

🎵 *Song:* ${title}
🎤 *Artist:* ${artist}

${lyrics}

Powered by Lyrics.ovh

┗━━━━━━━━━━━━━━━━┛
        `.trim();

        await sock.sendMessage(
          msg.key.remoteJid,
          { text: fullText },
          { quoted: msg }
        );
      }
    } catch (error) {
      const errorText = `
┏━━❌ *LYRICS NOT FOUND* ━━┓

😕 No lyrics found for:
🎵 *\( {title}* by * \){artist}*

Tips:
• Check spelling
• Try different artist name
• Some songs may not be available

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

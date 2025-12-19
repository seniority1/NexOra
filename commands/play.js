export default {
  name: "play",
  description: "Download and send audio from YouTube",
  async execute(sock, msg, args) {
    if (args.length === 0) {
      const usageText = `
┏━━🎵 *PLAY MUSIC* ━━┓

Please provide a song name!

📌 *Usage:* .play <song name>
Example: .play faded
         .play perfect ed sheeran

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      return await sock.sendMessage(
        msg.key.remoteJid,
        { text: usageText },
        { quoted: msg }
      );
    }

    const query = args.join(" ");
    const searchingText = `
┏━━🎵 *SEARCHING MUSIC* ━━┓

🎧 Looking for: *${query}*
⏳ This may take 10–30 seconds...

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: searchingText },
      { quoted: msg }
    );

    try {
      // Step 1: Search YouTube using free API
      const searchRes = await fetch(`https://youtube-search-results-api.herokuapp.com/search?q=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();

      if (!searchData.items || searchData.items.length === 0) {
        throw new Error("No results");
      }

      const video = searchData.items[0]; // Top result
      const title = video.title || "Unknown Song";
      const author = video.author?.name || "Unknown Artist";
      const duration = video.duration || "Unknown";
      const thumbnail = video.thumbnails?.[0]?.url || "";

      // Step 2: Get direct audio download link (using another free service)
      const downloadRes = await fetch(`https://api.yanzbotz.my.id/api/ytdl?query=${encodeURIComponent(video.url)}`);
      const downloadData = await downloadRes.json();

      let audioUrl = "";
      if (downloadData.result && downloadData.result.audio) {
        // Try different qualities
        audioUrl = downloadData.result.audio["128kbps"] || 
                   downloadData.result.audio["192kbps"] || 
                   Object.values(downloadData.result.audio)[0];
      }

      if (!audioUrl) throw new Error("Audio link not found");

      const successText = `
┏━━🎵 *NOW PLAYING* ━━┓

🎶 *Title:* ${title}
👤 *Artist:* ${author}
⏱ *Duration:* ${duration}

⬇️ Sending audio...

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: successText },
        { quoted: msg }
      );

      // Send audio with thumbnail and details
      await sock.sendMessage(msg.key.remoteJid, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
        ptt: false, // false = normal audio, true = voice note
        waveform: [0, 50, 10, 80, 20, 70, 30, 60], // fake waveform
        contextInfo: {
          externalAdReply: {
            title: title,
            body: `Played by NexOra Bot`,
            thumbnailUrl: thumbnail,
            mediaType: 2,
            mediaUrl: video.url,
          }
        }
      });

    } catch (error) {
      const errorText = `
┏━━❌ *PLAY ERROR* ━━┓

😕 Could not find or download audio for:
🎵 *"${query}"*

Tips:
• Try full song name + artist
• Check spelling
• Some songs may be blocked

Try again or use .yt for video!

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

import axios from "axios";

export default {
  name: "lyrics",
  description: "Fetch song lyrics",
  async execute(sock, msg, args) {
    const song = args.join(" ");
    if (!song)
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "🎶 *Usage:* .lyrics <song name>",
      });

    try {
      const { data } = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(song)}`);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🎵 *Lyrics for:* ${song}\n\n${data.lyrics || "❌ Not found."}`,
      });
    } catch {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Unable to fetch lyrics. Try another song.",
      });
    }
  },
};

export default {
  name: "google",
  description: "Search on Google",
  async execute(sock, msg, args) {
    if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: "┏━━🔍 *GOOGLE SEARCH* ━━┓\n\nPlease provide a query!\n\n📌 Usage: .google <search term>\n┗━━━━━━━━━━━━━━━━┛".trim() }, { quoted: msg });

    const query = args.join(" ");
    const text = `
┏━━🔍 *GOOGLE SEARCH* ━━┓

🔎 Searching: *${query}*
🌐 Results: https://www.google.com/search?q=${encodeURIComponent(query)}

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  }
};

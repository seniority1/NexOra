export default {
  name: "statusviews",
  description: "Show who viewed your WhatsApp statuses (if supported)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    try {
      // Try fetching current status viewers using a raw IQ query
      const result = await sock.query({
        tag: "iq",
        attrs: {
          type: "get",
          xmlns: "status",
          to: "status@broadcast",
        },
        content: [{ tag: "status", attrs: {} }],
      });

      if (!result || !result.content) {
        await sock.sendMessage(from, { text: "⚠️ Status views are not supported on your WhatsApp or Baileys version." }, { quoted: msg });
        return;
      }

      // Extract JIDs of people who viewed your status
      const viewers = result.content
        .map((v) => v.attrs?.jid)
        .filter((jid) => jid && jid.includes("@s.whatsapp.net"));

      if (viewers.length === 0) {
        await sock.sendMessage(from, { text: "😔 No one has viewed your statuses yet." }, { quoted: msg });
        return;
      }

      // Try fetching display names for each viewer
      const contacts = await Promise.all(
        viewers.map(async (jid) => {
          const contact = await sock.onWhatsApp(jid);
          const name = contact?.[0]?.notify || contact?.[0]?.jid?.split("@")[0];
          return `• ${name}`;
        })
      );

      const message = `
👀 *Status Views Report* 👀

📊 Total Viewers: *${viewers.length}*

${contacts.join("\n")}

🕓 Checked just now
      `.trim();

      await sock.sendMessage(from, { text: message }, { quoted: msg });
    } catch (err) {
      console.error("statusviews error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to fetch status viewers. (Feature may not be supported yet)" }, { quoted: msg });
    }
  },
};

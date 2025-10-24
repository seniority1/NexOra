export default {
  name: "speedtest",
  description: "Check response speed",
  async execute(sock, msg) {
    const start = Date.now();
    await sock.sendMessage(msg.key.remoteJid, { text: "🏃‍♂️ Testing speed..." });
    const end = Date.now();
    const speed = end - start;
    await sock.sendMessage(msg.key.remoteJid, { text: `⚡ *Speed:* ${speed} ms` });
  },
};

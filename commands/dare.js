const dares = [
  "Send a voice note saying 'I love NexOra Bot!' 😂",
  "Text your crush 'I miss you 😳'",
  "Change your status to 'I talk to my bot more than humans 🤖'",
  "Say 'NexOra is my king 👑' in the group chat!",
];

export default {
  name: "dare",
  description: "Get a dare challenge",
  async execute(sock, msg) {
    const random = dares[Math.floor(Math.random() * dares.length)];
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🔥 *Dare:* ${random}`,
    });
  },
};

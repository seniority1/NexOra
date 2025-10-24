const truths = [
  "What is your biggest fear?",
  "Who was your first crush?",
  "What’s the most embarrassing thing you’ve ever done?",
  "What secret have you never told anyone?",
];

export default {
  name: "truth",
  description: "Get a truth question",
  async execute(sock, msg) {
    const random = truths[Math.floor(Math.random() * truths.length)];
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🧠 *Truth:* ${random}`,
    });
  },
};

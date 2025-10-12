import { isOwner } from "../utils/isOwner.js";

export default {
  name: "hijack",
  description: "👑 Take control of a group (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    // ✅ Group only
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command can only be used in groups." }, { quoted: msg });
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    // 🧽 Delete the command message for stealth
    try {
      await sock.sendMessage(from, { delete: msg.key });
    } catch {}

    // 📝 Get group metadata
    let groupMetadata;
    try {
      groupMetadata = await sock.groupMetadata(from);
    } catch (error) {
      console.error("❌ Error getting group metadata:", error);
      return sock.sendMessage(from, { text: "⚠️ Failed to get group info." }, { quoted: msg });
    }

    const participants = groupMetadata.participants;
    const botNumber = (await sock.user.id).split(":")[0] + "@s.whatsapp.net";

    // 👑 1️⃣ Demote everyone except bot & owners
    for (const participant of participants) {
      const jid = participant.id;
      const isBot = jid === botNumber;
      const isOwnerNumber = isOwner(jid);

      if (participant.admin && !isBot && !isOwnerNumber) {
        try {
          await sock.groupParticipantsUpdate(from, [jid], "demote");
          await sleep(500);
        } catch (err) {
          console.error(`⚠️ Failed to demote ${jid}:`, err);
        }
      }
    }

    // 👑 2️⃣ Promote owners if not already admin
    for (const participant of participants) {
      const jid = participant.id;
      if (isOwner(jid) && !participant.admin) {
        try {
          await sock.groupParticipantsUpdate(from, [jid], "promote");
          await sleep(500);
        } catch (err) {
          console.error(`⚠️ Failed to promote ${jid}:`, err);
        }
      }
    }

    // 📝 3️⃣ Change group subject & description
    try {
      await sock.groupUpdateSubject(from, "𓂀 𝘼𝙙𝙙𝙚𝙭 𝙙𝙞𝙙 𝙩𝙝𝙞𝙨 ☠︎︎");
      await sleep(800);

      await sock.groupUpdateDescription(
        from,
        "☠︎︎✞ 𝑻𝒉𝒆 𝒓𝒆𝒊𝒈𝒏 𝒐𝒇 𝑨𝒅𝒅𝒆𝒙 𝒕𝒉𝒆 𝒕𝒚𝒓𝒂𝒏𝒕. ✞☠︎\n" +
          "♱ 𝑬𝒎𝒃𝒓𝒂𝒄𝒆 𝒕𝒉𝒆 𝒑𝒐𝒘𝒆𝒓 𝒐𝒇 𝒎𝒚 𝒆𝒙𝒊𝒔𝒕𝒆𝒏𝒄𝒆. ♱\n" +
          "✧ 𝑾𝒂𝒕𝒄𝒉 𝒂𝒔 𝒊 𝒃𝒂𝒑𝒕𝒖𝒔𝒆 𝒖 𝒊𝒏 𝒖𝒓 𝒃𝒍𝒐𝒐𝒅 𝒍𝒐𝒘𝒍𝒚 𝒎𝒐𝒏𝒈𝒓𝒆𝒍 ✧\n⚰︎"
      );
      await sleep(800);
    } catch (e) {
      console.error("⚠️ Failed to update group name or description:", e);
    }

    // 🔗 4️⃣ Revoke group link & leave
    try {
      await sock.groupRevokeInvite(from);
      await sleep(800);
      await sock.groupLeave(from);
    } catch (err) {
      console.error("❌ Failed to revoke or leave group:", err);
    }
  },
};

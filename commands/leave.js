export default {
  name: "leave",
  description: "Owner-only command to make the bot leave a group. Usage: .leave [group-id]",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const senderJid = msg.key.participant || msg.key.remoteJid || "";
    // ====== EDIT THIS: put your number here (bare or full JID) ======
    const OWNER_NUMBER = "2348012345678"; // e.g. "2348012345678" or "2348012345678@s.whatsapp.net"
    // =================================================================

    // normalize function (returns bare number part)
    const normalize = (jid) => {
      if (!jid) return "";
      const s = String(jid);
      return s.includes("@") ? s.split("@")[0] : s;
    };

    const normalizedSender = normalize(senderJid);
    const normalizedOwner = normalize(OWNER_NUMBER);

    // owner check
    if (normalizedSender !== normalizedOwner) {
      return sock.sendMessage(from, { text: "❌ This command is for *Owner only!*" }, { quoted: msg });
    }

    // Determine target group
    let targetGroup = null;

    // 1) If command used inside a group -> target that group
    if (from && from.endsWith("@g.us")) {
      targetGroup = from;
    }

    // 2) If owner provided an argument (group id), use that
    if (!targetGroup && args && args.length > 0) {
      let gid = args[0].trim();
      // if they passed just the numeric id, append @g.us
      if (!gid.includes("@")) {
        gid = `${gid}@g.us`;
      }
      // ensure it looks like a group jid
      if (gid.endsWith("@g.us")) {
        targetGroup = gid;
      }
    }

    if (!targetGroup) {
      return sock.sendMessage(from, {
        text: "⚠️ No group target found.\nUse this inside the group to make the bot leave, or from DM pass the group id: `.leave 12345-67890@g.us`",
      }, { quoted: msg });
    }

    try {
      // optional: notify group before leaving (silently notify owner instead if you prefer)
      try {
        await sock.sendMessage(targetGroup, { text: "👋 NexOra is leaving this group (requested by owner)." });
      } catch (notifyErr) {
        // ignore notify errors (some hosts block sending to groups right before leaving)
      }

      // Leave the group
      await sock.groupLeave(targetGroup);

      // confirm to owner
      await sock.sendMessage(from, { text: `✅ Successfully left group: ${targetGroup}` }, { quoted: msg });
    } catch (err) {
      console.error("❌ Leave command error:", err);
      await sock.sendMessage(from, { text: `❌ Failed to leave the group: ${err.message || err}` }, { quoted: msg });
    }
  },
};

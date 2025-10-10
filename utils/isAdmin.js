// utils/isAdmin.js
export async function isAdmin(sock, groupId, userId) {
  try {
    const metadata = await sock.groupMetadata(groupId);
    const admins = metadata.participants
      .filter((p) => p.admin === "admin" || p.admin === "superadmin")
      .map((p) => p.id);

    return admins.includes(userId);
  } catch (err) {
    console.error("❌ isAdmin check failed:", err);
    return false;
  }
}

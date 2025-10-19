import config from "../config.js";

export function isOwner(sender) {
  if (!sender) return false;

  // Normalize sender: handle @s.whatsapp.net or @lid
  const cleanSender = sender.replace(/@(s\.whatsapp\.net|lid)$/i, "");

  // Normalize owners too
  return config.owners.some(owner =>
    cleanSender === owner.replace(/@(s\.whatsapp\.net|lid)$/i, "")
  );
}

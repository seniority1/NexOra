import config from "../config.js";

export function isOwner(sender) {
  if (!sender) return false;

  // Normalize: "2349160291884@s.whatsapp.net" → "2349160291884"
  const cleanSender = sender.split("@")[0];

  // Normalize owner list too
  return config.owners.some(owner => cleanSender === owner.split("@")[0]);
}

import fs from "fs";
import config from "../config.js";

const OWNER_FILE = "./owners.json";

// ✅ Ensure owners.json exists
if (!fs.existsSync(OWNER_FILE)) {
  fs.writeFileSync(OWNER_FILE, JSON.stringify({ owners: config.owners }, null, 2));
}

// ✅ Get all owners
export function getOwners() {
  const data = JSON.parse(fs.readFileSync(OWNER_FILE));
  return data.owners || [];
}

// ✅ Add a new owner (and save permanently)
export function addOwner(jid) {
  const cleanJid = jid.replace(/@(s\.whatsapp\.net|lid)$/i, "");
  const data = JSON.parse(fs.readFileSync(OWNER_FILE));

  // Prevent duplicates
  if (!data.owners.some(o => o.replace(/@(s\.whatsapp\.net|lid)$/i, "") === cleanJid)) {
    data.owners.push(jid);
    fs.writeFileSync(OWNER_FILE, JSON.stringify(data, null, 2));
  }
}

// ✅ Remove an owner (and save permanently)
export function delOwner(jid) {
  const cleanJid = jid.replace(/@(s\.whatsapp\.net|lid)$/i, "");
  const data = JSON.parse(fs.readFileSync(OWNER_FILE));

  const updated = data.owners.filter(
    o => o.replace(/@(s\.whatsapp\.net|lid)$/i, "") !== cleanJid
  );

  data.owners = updated;
  fs.writeFileSync(OWNER_FILE, JSON.stringify(data, null, 2));
}

// ✅ Check if sender is owner
export function isOwner(sender) {
  if (!sender) return false;

  const cleanSender = sender.replace(/@(s\.whatsapp\.net|lid)$/i, "");
  const data = JSON.parse(fs.readFileSync(OWNER_FILE));

  return data.owners.some(o => o.replace(/@(s\.whatsapp\.net|lid)$/i, "") === cleanSender);
}

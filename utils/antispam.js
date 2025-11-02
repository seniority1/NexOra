import ms from "ms";

// ⚙️ For per-group control
const usedCommandRecently = new Map(); // Map<groupId, Set<senderId>>
const spamDB = new Map(); // Map<groupId, Array<{ id, spam, expired }>>

export function isFiltered(groupId, sender) {
  const groupSet = usedCommandRecently.get(groupId);
  return groupSet ? groupSet.has(sender) : false;
}

export function addFilter(groupId, sender, delay = 2000) {
  if (!usedCommandRecently.has(groupId)) usedCommandRecently.set(groupId, new Set());
  const groupSet = usedCommandRecently.get(groupId);
  groupSet.add(sender);
  setTimeout(() => groupSet.delete(sender), delay);
}

export function addSpam(groupId, sender) {
  if (!spamDB.has(groupId)) spamDB.set(groupId, []);
  const db = spamDB.get(groupId);

  const i = db.findIndex((x) => x.id === sender);
  if (i !== -1) db[i].spam += 1;
  else db.push({ id: sender, spam: 1, expired: Date.now() + ms("10m") });
}

export function resetSpam() {
  setInterval(() => {
    for (const [groupId, db] of spamDB.entries()) {
      for (let i = db.length - 1; i >= 0; i--) {
        if (Date.now() >= db[i].expired) db.splice(i, 1);
      }
    }
  }, 1000);
}

export function isSpam(groupId, sender) {
  const db = spamDB.get(groupId);
  if (!db) return false;
  const u = db.find((x) => x.id === sender);
  return u ? u.spam >= 6 : false;
}

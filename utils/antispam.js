import ms from "ms"

// 🕒 Store of users who recently used a command
const usedCommandRecently = new Set()

/**
 * ✅ Check if a user is in cooldown
 */
export function isFiltered(from) {
  return usedCommandRecently.has(from)
}

/**
 * ➕ Add a user to cooldown
 * @param {string} from - user JID
 * @param {number} delay - cooldown in ms (default: 2000ms)
 */
export function addFilter(from, delay = 2000) {
  usedCommandRecently.add(from)
  setTimeout(() => usedCommandRecently.delete(from), delay)
}

/**
 * ➕ Record spam activity
 */
export function addSpam(sender, db) {
  const index = db.findIndex((e) => e.id === sender)
  if (index !== -1) {
    db[index].spam += 1
  } else {
    db.push({
      id: sender,
      spam: 1,
      expired: Date.now() + ms("10m"), // 10 min expiry
    })
  }
}

/**
 * ♻️ Auto-clean expired spam entries
 */
export function resetSpam(db) {
  setInterval(() => {
    for (let i = db.length - 1; i >= 0; i--) {
      if (Date.now() >= db[i].expired) {
        console.log(`🧹 Spam expired: ${db[i].id}`)
        db.splice(i, 1)
      }
    }
  }, 1000)
}

/**
 * 🚫 Check if user has spammed too much
 */
export function isSpam(sender, db) {
  const entry = db.find((e) => e.id === sender)
  return entry ? entry.spam >= 6 : false
}

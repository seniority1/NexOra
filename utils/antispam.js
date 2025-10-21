import ms from "ms"

const usedCommandRecently = new Set()

export function isFiltered(from) {
  return usedCommandRecently.has(from)
}

export function addFilter(from, delay = 2000) {
  usedCommandRecently.add(from)
  setTimeout(() => usedCommandRecently.delete(from), delay)
}

export function addSpam(sender, db) {
  const i = db.findIndex((x) => x.id === sender)
  if (i !== -1) db[i].spam += 1
  else db.push({ id: sender, spam: 1, expired: Date.now() + ms("10m") })
}

export function resetSpam(db) {
  setInterval(() => {
    for (let i = db.length - 1; i >= 0; i--) {
      if (Date.now() >= db[i].expired) db.splice(i, 1)
    }
  }, 1000)
}

export function isSpam(sender, db) {
  const u = db.find((x) => x.id === sender)
  return u ? u.spam >= 6 : false
}

// utils/activityTracker.js
import fs from "fs";

const file = "./database/activity.json";

// ✅ Ensure file exists
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}));

export function getActivityData() {
  return JSON.parse(fs.readFileSync(file));
}

export function saveActivityData(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ✅ Update user’s activity (count + timestamp)
export function updateActivity(group, user) {
  const db = getActivityData();
  if (!db[group]) db[group] = {};
  if (!db[group][user]) db[group][user] = { count: 0, lastSeen: 0 };

  db[group][user].count += 1;
  db[group][user].lastSeen = Date.now();
  saveActivityData(db);
}

// ✅ Get full activity list for a group
export function getGroupActivity(group) {
  const db = getActivityData();
  if (!db[group]) return {};
  // Convert structure { user: {count, lastSeen} } → { user: count }
  const counts = {};
  for (const user in db[group]) counts[user] = db[group][user].count || 0;
  return counts;
}

// ✅ Get users inactive for X days
export function getInactiveUsers(group, days = 7) {
  const db = getActivityData();
  if (!db[group]) return [];

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return Object.entries(db[group])
    .filter(([_, info]) => info.lastSeen < cutoff)
    .map(([user]) => user);
}

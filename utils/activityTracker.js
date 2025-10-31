// utils/activityTracker.js
import fs from "fs";

const file = "./database/activity.json";

// Ensure file exists
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}));

export function getActivityData() {
  return JSON.parse(fs.readFileSync(file));
}

export function saveActivityData(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function updateActivity(group, user) {
  const db = getActivityData();
  if (!db[group]) db[group] = {};
  db[group][user] = Date.now();
  saveActivityData(db);
}

export function getInactiveUsers(group, days = 7) {
  const db = getActivityData();
  if (!db[group]) return [];

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return Object.entries(db[group])
    .filter(([_, lastSeen]) => lastSeen < cutoff)
    .map(([user]) => user);
}

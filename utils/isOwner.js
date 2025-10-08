import config from "../config.js";

export function isOwner(sender) {
  return config.owners.some(num => sender.includes(num));
}

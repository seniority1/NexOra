import fetch from "node-fetch";
import * as cheerio from "cheerio";
import FormData from "form-data";

// 🧩 Function to create text effects from textpro.me
export async function textpro(url, text) {
  if (!/^https:\/\/textpro\.me\//.test(url)) throw new Error("Invalid TextPro URL");

  const form = new FormData();
  form.append("text[]", text);
  const res = await fetch(url, { method: "POST", body: form });
  const html = await res.text();
  const $ = cheerio.load(html);
  const img = $("div[class='btn-group'] a").attr("href");

  if (!img) throw new Error("Image not found");
  return "https://textpro.me" + img;
}

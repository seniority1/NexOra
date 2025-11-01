import OpenAI from "openai";
import config from "../config.js";

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export async function image_gen(prompt) {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
  });
  return result.data[0].url;
}

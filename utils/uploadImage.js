// utils/uploadImage.js
import axios from "axios";
import FormData from "form-data";

/**
 * Upload an image buffer to telegra.ph and return a public URL
 * @param {Buffer} buffer - Image buffer from WhatsApp
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
export async function uploadImage(buffer) {
  const form = new FormData();
  const blob = new Blob([buffer], { type: "image/jpeg" });
  form.append("file", blob, "image.jpg");

  try {
    const res = await axios.post("https://telegra.ph/upload", form, {
      headers: form.getHeaders(),
    });

    if (Array.isArray(res.data) && res.data[0]?.src) {
      return "https://telegra.ph" + res.data[0].src;
    } else {
      throw new Error("Invalid response from telegra.ph");
    }
  } catch (err) {
    console.error("❌ Image upload failed:", err);
    throw new Error("Failed to upload image");
  }
}

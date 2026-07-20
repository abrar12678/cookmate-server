import { Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import env from "../config/env";

export const uploadController = {
  async uploadImage(req: Request, res: Response) {
    try {
      let { base64 } = req.body;

      if (!base64 || typeof base64 !== "string") {
        res.status(400).json({ success: false, message: "No base64 image data provided" });
        return;
      }

      // FileReader.readAsDataURL() produces "data:image/png;base64,iVBOR..."
      // ImgBB expects only the raw base64 part after the comma
      const commaIndex = base64.indexOf(",");
      if (commaIndex !== -1) {
        base64 = base64.substring(commaIndex + 1);
      }

      const form = new FormData();
      form.append("key", env.IMG_BB_API_KEY);
      form.append("image", base64);

      const response = await axios.post(
        "https://api.imgbb.com/1/upload",
        form,
        {
          headers: form.getHeaders(),
        },
      );

      res.status(200).json({
        success: true,
        data: { url: response.data.data.url },
      });
    } catch (error: unknown) {
      // Log full error server-side for debugging
      console.error("[Upload] ImgBB error:", error instanceof Error ? error.message : error);
      const msg = error instanceof Error ? error.message : "Image upload failed";
      res.status(500).json({ success: false, message: msg });
    }
  },
};
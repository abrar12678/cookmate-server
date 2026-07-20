import { Request, Response } from "express";
import { getDb } from "../config/db";

export const newsletterController = {
  async subscribe(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        res.status(400).json({ success: false, message: "A valid email is required" });
        return;
      }

      const db = getDb();
      const newsletters = db.collection("newsletters");

      const existing = await newsletters.findOne({ email });
      if (existing) {
        res.status(409).json({ success: false, message: "This email is already subscribed" });
        return;
      }

      await newsletters.insertOne({ email, subscribedAt: new Date() });

      res.status(201).json({
        success: true,
        message: "Subscribed successfully!",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },
};
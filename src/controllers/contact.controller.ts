import { Request, Response } from "express";
import { getDb } from "../config/db";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const contactController = {
  async submit(req: Request, res: Response) {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.issues[0].message,
        });
        return;
      }

      const db = getDb();
      await db.collection("contacts").insertOne({
        ...parsed.data,
        createdAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Message sent successfully!",
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message: msg });
    }
  },
};
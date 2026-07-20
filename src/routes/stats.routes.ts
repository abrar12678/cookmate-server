import { Router } from "express";
import { statsController } from "../controllers/stats.controller";

const router = Router();

router.get("/", statsController.getStats);
router.get("/testimonials", statsController.getTestimonials); // ← NEW

export default router;

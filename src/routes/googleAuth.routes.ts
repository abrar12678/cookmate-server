import { Router } from "express";
import { googleAuthController } from "../controllers/googleAuth.controller";

const router = Router();

router.get("/google", googleAuthController.googleAuth);
router.get("/google/callback", googleAuthController.googleCallback);

export default router;
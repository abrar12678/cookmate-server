import { Router, Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { authenticate } from "../middleware/auth.middleware";
import { aiController } from "../controllers/ai.controller";
import {
  generateRecipeSchema,
  analyzeFoodSchema,
} from "../validators/ai.validator";

function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      _res.status(400).json({
        success: false,
        message: result.error.issues[0].message,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

const router = Router();

router.post(
  "/generate-recipe",
  authenticate,
  validate(generateRecipeSchema),
  aiController.generateRecipe,
);
router.post(
  "/analyze-food",
  authenticate,
  validate(analyzeFoodSchema),
  aiController.analyzeFood,
);

export default router;

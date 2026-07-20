import { Router } from "express";
import { recipeController } from "../controllers/recipe.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public
router.get("/", recipeController.getRecipes);
router.get("/popular", recipeController.getPopularRecipes);
router.get("/favorites", authenticate, recipeController.getFavorites);

// Dynamic ID routes
router.get("/:id", recipeController.getRecipeById);
router.get("/:id/reviews", recipeController.getReviews);
router.post("/:id/rate", authenticate, recipeController.rateRecipe);
router.post("/:id/favorite", authenticate, recipeController.addFavorite);
router.get("/:id/favorite", authenticate, recipeController.checkFavorite);
router.delete("/:id/favorite", authenticate, recipeController.removeFavorite);

// CRUD
router.post("/", authenticate, recipeController.createRecipe);
router.put("/:id", authenticate, recipeController.updateRecipe);
router.delete("/:id", authenticate, recipeController.deleteRecipe);

export default router;
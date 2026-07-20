import { Router } from "express";
import { adminOnly } from "../middleware/admin.middleware";
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getRecipes,
  deleteRecipe,
  toggleFeaturedRecipe,
  getReviews,
  deleteReview,
  getNewsletters,
  deleteNewsletter,
  getContacts,
  deleteContact,
} from "../controllers/admin.controller";

const router = Router();

// Dashboard
router.get("/dashboard", adminOnly, getDashboardStats);

// Users
router.get("/users", adminOnly, getUsers);
router.get("/users/:id", adminOnly, getUserById);
router.patch("/users/:id/role", adminOnly, updateUserRole);
router.delete("/users/:id", adminOnly, deleteUser);

// Recipes
router.get("/recipes", adminOnly, getRecipes);
router.delete("/recipes/:id", adminOnly, deleteRecipe);
router.patch("/recipes/:id/featured", adminOnly, toggleFeaturedRecipe);

// Reviews
router.get("/reviews", adminOnly, getReviews);
router.delete("/reviews/:id", adminOnly, deleteReview);

// Newsletters
router.get("/newsletters", adminOnly, getNewsletters);
router.delete("/newsletters/:id", adminOnly, deleteNewsletter);

// Contacts
router.get("/contacts", adminOnly, getContacts);
router.delete("/contacts/:id", adminOnly, deleteContact);

export default router;
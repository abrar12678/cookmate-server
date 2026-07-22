import { ObjectId } from "mongodb";

export interface RecipeDocument {
  _id: ObjectId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  image?: string;
  cuisine: string;
  difficulty: string;
  cookingTime: number;
  servings: number;
  ingredients: Array<{ name: string; qty: string; unit: string }>;
  instructions: string[];
  dietaryTags?: string[];
  rating: number;
  reviewCount: number;
  createdBy: ObjectId;
  createdAt: Date;
}

export interface ReviewDocument {
  _id?: ObjectId;
  recipeId: ObjectId;
  userId: ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
}

export interface FavoriteDocument {
  _id: ObjectId;
  userId: ObjectId;
  recipeId: ObjectId;
  createdAt: Date;
}

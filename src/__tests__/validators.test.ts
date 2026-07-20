import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/auth.validator";
import { createRecipeSchema } from "../validators/recipe.validator";
import {
  generateRecipeSchema,
  analyzeFoodSchema,
} from "../validators/ai.validator";

describe("Auth Validators", () => {
  describe("registerSchema", () => {
    it("should validate correct data", () => {
      const result = registerSchema.safeParse({
        name: "John",
        email: "john@test.com",
        password: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject short name", () => {
      const result = registerSchema.safeParse({
        name: "J",
        email: "john@test.com",
        password: "123456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = registerSchema.safeParse({
        name: "John",
        email: "notanemail",
        password: "123456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = registerSchema.safeParse({
        name: "John",
        email: "john@test.com",
        password: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should validate correct data", () => {
      const result = loginSchema.safeParse({
        email: "john@test.com",
        password: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing password", () => {
      const result = loginSchema.safeParse({
        email: "john@test.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateProfileSchema", () => {
    it("should validate name update", () => {
      const result = updateProfileSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("should validate bio update", () => {
      const result = updateProfileSchema.safeParse({ bio: "I love cooking!" });
      expect(result.success).toBe(true);
    });

    it("should validate empty body (optional fields)", () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe("Recipe Validator", () => {
  it("should validate correct recipe data", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test Recipe",
      shortDescription: "A test recipe description",
      fullDescription: "This is a more detailed description for testing",
      ingredients: [{ name: "Egg", qty: "2", unit: "pieces" }],
      instructions: ["Boil water", "Add egg"],
      cuisine: "Italian",
      difficulty: "Easy",
      cookingTime: 30,
      servings: 2,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid difficulty", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      shortDescription: "A test recipe description",
      fullDescription: "This is a more detailed description for testing",
      ingredients: [{ name: "Egg", qty: "2", unit: "pieces" }],
      instructions: ["Boil water"],
      cuisine: "Italian",
      difficulty: "SuperHard",
      cookingTime: 30,
      servings: 2,
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty ingredients", () => {
    const result = createRecipeSchema.safeParse({
      title: "Test",
      shortDescription: "A test recipe description",
      fullDescription: "This is a more detailed description for testing",
      ingredients: [],
      instructions: ["Boil water"],
      cuisine: "Italian",
      difficulty: "Easy",
      cookingTime: 30,
      servings: 2,
    });
    expect(result.success).toBe(false);
  });
});

describe("AI Validators", () => {
  describe("generateRecipeSchema", () => {
    it("should validate correct data", () => {
      const result = generateRecipeSchema.safeParse({
        ingredients: ["chicken", "rice"],
        outputLength: "detailed",
      });
      expect(result.success).toBe(true);
    });

    it("should reject more than 15 ingredients", () => {
      const result = generateRecipeSchema.safeParse({
        ingredients: Array(16).fill("ingredient"),
        outputLength: "detailed",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty ingredients", () => {
      const result = generateRecipeSchema.safeParse({
        ingredients: [],
        outputLength: "detailed",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("analyzeFoodSchema", () => {
    it("should validate correct food description", () => {
      const result = analyzeFoodSchema.safeParse({
        foodDescription: "Chicken Biryani with raita",
      });
      expect(result.success).toBe(true);
    });

    it("should reject too short description", () => {
      const result = analyzeFoodSchema.safeParse({
        foodDescription: "Ab",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      const result = analyzeFoodSchema.safeParse({
        foodDescription: "",
      });
      expect(result.success).toBe(false);
    });
  });
});

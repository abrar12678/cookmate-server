
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { connectDB, getDb } from "./src/config/db";

async function seedDB() {
  try {
    await connectDB();
    const db = getDb();

    // Drop existing collections
    try {
      await db.collection("users").drop();
    } catch {}
    try {
      await db.collection("recipes").drop();
    } catch {}

    // Create demo user
    const hashedPassword = await bcrypt.hash("Demo@123456", 10);
    const userResult = await db.collection("users").insertOne({
      name: "Demo User",
      email: "demo@cookmate.com",
      password: hashedPassword,
      dietaryTags: [], createdAt: new Date(),
    });
    const demoUserId = userResult.insertedId;

    // 12 realistic recipes
    const recipes = [
      // --- ITALIAN ---
      {
        title: "Spaghetti Carbonara",
        shortDescription:
          "A classic Roman pasta dish made with eggs, Pecorino Romano, and crispy guanciale.",
        fullDescription:
          "Spaghetti Carbonara is one of Rome's most iconic dishes. Traditionally made with guanciale, eggs, Pecorino Romano cheese, and black pepper, this creamy pasta relies on the emulsion of egg and cheese rather than any cream. The result is a rich, silky sauce that clings to every strand of spaghetti. It is a masterclass in simplicity — just five ingredients, each one essential.",
        ingredients: [
          { name: "Spaghetti", qty: "400", unit: "gram" },
          { name: "Guanciale", qty: "200", unit: "gram" },
          { name: "Egg yolks", qty: "6", unit: "pieces" },
          { name: "Pecorino Romano", qty: "100", unit: "gram" },
          { name: "Black pepper", qty: "2", unit: "tsp" },
          { name: "Salt", qty: "1", unit: "tsp" },
        ],
        instructions: [
          "Bring a large pot of salted water to a rolling boil and cook the spaghetti until al dente.",
          "While the pasta cooks, cut the guanciale into small strips and cook in a large skillet over medium heat until golden and crispy, about 7 minutes.",
          "In a bowl, whisk together the egg yolks, grated Pecorino Romano, and freshly cracked black pepper until smooth.",
          "Reserve one cup of pasta water before draining the spaghetti.",
          "Add the drained pasta to the skillet with guanciale, toss well, and remove from heat.",
          "Pour the egg and cheese mixture over the pasta, tossing vigorously. Add pasta water a splash at a time until you get a creamy, glossy sauce.",
          "Serve immediately with extra Pecorino and black pepper on top.",
        ],
        cuisine: "Italian",
        difficulty: "Medium",
        cookingTime: 25,
        servings: 4,
        image:
          "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&h=600&fit=crop",
        rating: 4.8,
        reviewCount: 342,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
      {
        title: "Margherita Pizza",
        shortDescription:
          "The original Neapolitan pizza with San Marzano tomatoes, fresh mozzarella, and basil.",
        fullDescription:
          "Margherita Pizza was born in Naples in 1889, named after Queen Margherita of Italy. Topped with simple yet high-quality ingredients — San Marzano tomato sauce, fresh mozzarella di bufala, and fragrant basil leaves — it represents the colors of the Italian flag. The secret lies in a perfectly fermented dough, blistered at extreme heat in a wood-fired oven, resulting in a soft, chewy crust with a crisp cornicione.",
        ingredients: [
          { name: "All-purpose flour", qty: "500", unit: "gram" },
          { name: "Active dry yeast", qty: "7", unit: "gram" },
          { name: "Warm water", qty: "325", unit: "ml" },
          { name: "Salt", qty: "10", unit: "gram" },
          { name: "San Marzano tomatoes", qty: "400", unit: "gram" },
          { name: "Fresh mozzarella", qty: "250", unit: "gram" },
          { name: "Fresh basil leaves", qty: "10", unit: "pieces" },
          { name: "Olive oil", qty: "2", unit: "tbsp" },
        ],
        instructions: [
          "Dissolve yeast in warm water and let it sit for 5 minutes until frothy.",
          "Mix flour and salt, then add the yeast mixture and olive oil. Knead for 10 minutes until smooth and elastic.",
          "Cover the dough and let it rise in a warm place for at least 2 hours or until doubled in size.",
          "Crush the San Marzano tomatoes by hand with a pinch of salt for the sauce.",
          "Preheat your oven to the highest setting (ideally 250°C or higher) with a pizza stone or inverted baking sheet inside.",
          "Divide the dough into 4 portions. Stretch each into a thin round and spread a thin layer of tomato sauce.",
          "Tear the mozzarella into pieces and distribute over the pizza, leaving some sauce visible.",
          "Bake for 8-10 minutes until the crust is golden and cheese is bubbling. Top with fresh basil and a drizzle of olive oil before serving.",
        ],
        cuisine: "Italian",
        difficulty: "Hard",
        cookingTime: 45,
        servings: 4,
        image:
          "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&h=600&fit=crop",
        rating: 4.7,
        reviewCount: 289,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
      {
        title: "Risotto alla Milanese",
        shortDescription:
          "A luxurious saffron-infused risotto from Milan, creamy and golden.",
        fullDescription:
          "Risotto alla Milanese is a cornerstone of Lombard cuisine, dating back to the 16th century. Infused with precious saffron threads, this risotto achieves a stunning golden hue and a deeply aromatic flavor. The slow addition of warm broth while stirring creates the signature creamy texture without a drop of cream. Often served alongside Osso Buco, it is a dish that rewards patience and attention.",
        ingredients: [
          { name: "Arborio rice", qty: "320", unit: "gram" },
          { name: "Saffron threads", qty: "1", unit: "gram" },
          { name: "Chicken broth", qty: "1.5", unit: "liter" },
          { name: "Onion", qty: "1", unit: "pieces" },
          { name: "White wine", qty: "150", unit: "ml" },
          { name: "Butter", qty: "50", unit: "gram" },
          { name: "Parmigiano Reggiano", qty: "80", unit: "gram" },
          { name: "Olive oil", qty: "2", unit: "tbsp" },
        ],
        instructions: [
          "Warm the chicken broth in a saucepan and keep it on low heat throughout the cooking process.",
          "Bloom the saffron threads in 3 tablespoons of warm broth and set aside.",
          "Finely dice the onion and sauté in olive oil and half the butter until translucent, about 5 minutes.",
          "Add the Arborio rice and toast for 2 minutes, stirring constantly until the edges become slightly translucent.",
          "Pour in the white wine and stir until it is fully absorbed.",
          "Add the warm broth one ladle at a time, stirring frequently and waiting for each addition to be absorbed before adding the next. This should take about 18 minutes.",
          "Stir in the saffron mixture, the remaining butter, and grated Parmigiano Reggiano. Season with salt to taste.",
          "Cover and rest for 2 minutes before serving. The risotto should be creamy and flow slowly when plated.",
        ],
        cuisine: "Italian",
        difficulty: "Medium",
        cookingTime: 35,
        servings: 4,
        image:
          "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&h=600&fit=crop",
        rating: 4.6,
        reviewCount: 178,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },

      // --- ASIAN (Thai / Chinese / Japanese) ---
      {
        title: "Pad Thai",
        shortDescription:
          "Thailand's most famous stir-fried noodle dish, balanced with sweet, sour, and savory flavors.",
        fullDescription:
          "Pad Thai is the undisputed national dish of Thailand, found on nearly every street corner from Bangkok to Chiang Mai. This wok-fried rice noodle dish achieves a remarkable balance of sweet, sour, salty, and umami flavors using tamarind paste, fish sauce, and palm sugar. Topped with crushed peanuts, fresh lime, and a sprinkle of chili flakes, it is a vibrant one-plate meal that is both satisfying and deeply flavorful.",
        ingredients: [
          { name: "Rice noodles", qty: "250", unit: "gram" },
          { name: "Shrimp", qty: "200", unit: "gram" },
          { name: "Tamarind paste", qty: "3", unit: "tbsp" },
          { name: "Fish sauce", qty: "2", unit: "tbsp" },
          { name: "Palm sugar", qty: "2", unit: "tbsp" },
          { name: "Eggs", qty: "2", unit: "pieces" },
          { name: "Bean sprouts", qty: "100", unit: "gram" },
          { name: "Crushed peanuts", qty: "50", unit: "gram" },
          { name: "Lime", qty: "2", unit: "pieces" },
          { name: "Garlic cloves", qty: "3", unit: "pieces" },
        ],
        instructions: [
          "Soak the rice noodles in warm water for 30 minutes, then drain well.",
          "Mix the tamarind paste, fish sauce, and palm sugar in a small bowl to make the Pad Thai sauce.",
          "Heat oil in a wok over high heat. Stir-fry the shrimp for 2 minutes until pink, then set aside.",
          "In the same wok, add minced garlic and stir-fry for 30 seconds. Push aside and crack in the eggs, scrambling them lightly.",
          "Add the drained noodles and the sauce. Toss everything together over high heat for 2-3 minutes until the noodles absorb the sauce.",
          "Return the shrimp, add the bean sprouts, and toss for 30 seconds.",
          "Serve on a plate with crushed peanuts, lime wedges, and chili flakes on the side.",
        ],
        cuisine: "Thai",
        difficulty: "Medium",
        cookingTime: 30,
        servings: 3,
        image:
          "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop",
        rating: 4.7,
        reviewCount: 256,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
      {
        title: "Kung Pao Chicken",
        shortDescription:
          "A fiery Sichuan classic featuring tender chicken, peanuts, and dried red chilies.",
        fullDescription:
          "Kung Pao Chicken is one of the most celebrated dishes in Sichuan cuisine, known for its bold interplay of spicy, sweet, and nutty flavors. Diced chicken is marinated, quickly stir-fried with a fragrant mix of dried red chilies and Sichuan peppercorns, then coated in a glossy sauce made from soy sauce, black vinegar, and sugar. The addition of roasted peanuts provides a satisfying crunch that makes every bite irresistible.",
        ingredients: [
          { name: "Chicken breast", qty: "400", unit: "gram" },
          { name: "Dried red chilies", qty: "10", unit: "pieces" },
          { name: "Sichuan peppercorns", qty: "1", unit: "tbsp" },
          { name: "Roasted peanuts", qty: "80", unit: "gram" },
          { name: "Soy sauce", qty: "3", unit: "tbsp" },
          { name: "Chinese black vinegar", qty: "2", unit: "tbsp" },
          { name: "Sugar", qty: "1", unit: "tbsp" },
          { name: "Cornstarch", qty: "1", unit: "tbsp" },
          { name: "Garlic", qty: "4", unit: "cloves" },
          { name: "Spring onions", qty: "3", unit: "pieces" },
        ],
        instructions: [
          "Cut the chicken into small cubes. Marinate with 1 tablespoon soy sauce and cornstarch for 15 minutes.",
          "Mix the remaining soy sauce, black vinegar, sugar, and a splash of water to make the sauce.",
          "Heat oil in a wok over high heat. Fry the dried chilies and Sichuan peppercorns for 30 seconds until fragrant.",
          "Add the chicken and stir-fry for 3-4 minutes until golden and cooked through.",
          "Add minced garlic and stir-fry for another 30 seconds.",
          "Pour in the sauce mixture and toss until it thickens and coats the chicken evenly.",
          "Remove from heat, stir in the roasted peanuts and sliced spring onions, and serve immediately with steamed rice.",
        ],
        cuisine: "Chinese",
        difficulty: "Medium",
        cookingTime: 25,
        servings: 3,
        image:
          "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&h=600&fit=crop",
        rating: 4.6,
        reviewCount: 198,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
      {
        title: "Sushi Rolls",
        shortDescription:
          "Homemade maki rolls with fresh salmon, avocado, and seasoned sushi rice.",
        fullDescription:
          "Sushi rolls, or maki, are a beloved Japanese dish that combines vinegared rice with fresh fish and vegetables, all wrapped in roasted seaweed. While making sushi at home requires some technique, the reward is enormous — a restaurant-quality roll with perfectly seasoned rice, silky salmon, and creamy avocado. Served with soy sauce, wasabi, and pickled ginger, these rolls are as fun to make as they are to eat.",
        ingredients: [
          { name: "Sushi rice", qty: "300", unit: "gram" },
          { name: "Nori sheets", qty: "4", unit: "pieces" },
          { name: "Fresh salmon fillet", qty: "200", unit: "gram" },
          { name: "Avocado", qty: "1", unit: "pieces" },
          { name: "Rice vinegar", qty: "3", unit: "tbsp" },
          { name: "Sugar", qty: "1", unit: "tbsp" },
          { name: "Salt", qty: "1", unit: "tsp" },
          { name: "Soy sauce", qty: "4", unit: "tbsp" },
          { name: "Wasabi paste", qty: "1", unit: "tbsp" },
          { name: "Pickled ginger", qty: "20", unit: "gram" },
        ],
        instructions: [
          "Rinse the sushi rice under cold water until the water runs clear. Cook according to package instructions.",
          "Mix rice vinegar, sugar, and salt until dissolved. Fold this seasoning into the hot rice gently and let it cool to room temperature.",
          "Slice the salmon into thin strips and the avocado into long wedges.",
          "Place a nori sheet on a bamboo mat with the shiny side down. Spread a thin, even layer of rice over the nori, leaving a 1cm strip at the top edge.",
          "Lay salmon and avocado strips horizontally across the center of the rice.",
          "Roll tightly using the bamboo mat, sealing the edge with a little water.",
          "Using a sharp, wet knife, slice each roll into 6-8 pieces. Serve with soy sauce, wasabi, and pickled ginger.",
        ],
        cuisine: "Japanese",
        difficulty: "Hard",
        cookingTime: 45,
        servings: 4,
        image:
          "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop",
        rating: 4.5,
        reviewCount: 164,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },

      // --- INDIAN ---
      {
        title: "Chicken Biryani",
        shortDescription:
          "A fragrant, layered rice dish with spiced chicken, saffron, and caramelized onions.",
        fullDescription:
          "Chicken Biryani is the crown jewel of Indian cuisine, a dish that transforms simple rice and chicken into something extraordinary through the magic of layered cooking. Basmati rice is parboiled and then layered with marinated chicken that has been cooked in a rich blend of yogurt and aromatic spices. Saffron-infused milk and crispy fried onions add depth and color. Slow-cooked on low heat (dum), the result is rice that is infused with the essence of the spiced meat below.",
        ingredients: [
          { name: "Basmati rice", qty: "400", unit: "gram" },
          { name: "Chicken thighs", qty: "600", unit: "gram" },
          { name: "Yogurt", qty: "200", unit: "gram" },
          { name: "Onions", qty: "3", unit: "pieces" },
          { name: "Tomatoes", qty: "2", unit: "pieces" },
          { name: "Ginger-garlic paste", qty: "2", unit: "tbsp" },
          { name: "Saffron strands", qty: "1", unit: "gram" },
          { name: "Garam masala", qty: "1.5", unit: "tbsp" },
          { name: "Turmeric powder", qty: "1", unit: "tsp" },
          { name: "Whole spices", qty: "1", unit: "tbsp" },
          { name: "Fresh mint leaves", qty: "20", unit: "gram" },
          { name: "Ghee", qty: "3", unit: "tbsp" },
        ],
        instructions: [
          "Wash and soak the basmati rice for 30 minutes. Parboil it with whole spices and salt until 70% cooked, then drain.",
          "Marinate the chicken with yogurt, ginger-garlic paste, turmeric, garam masala, and salt for at least 30 minutes.",
          "Slice the onions thinly and fry in ghee until deep golden brown. Remove half for garnish.",
          "In the same pot, cook the marinated chicken with tomatoes and remaining fried onions on medium-high heat for 10 minutes.",
          "Layer the parboiled rice over the chicken. Drizzle saffron-soaked milk and ghee over the rice.",
          "Scatter fresh mint leaves and reserved fried onions on top.",
          "Cover tightly with a lid and cook on very low heat (dum) for 20 minutes. Gently mix before serving.",
        ],
        cuisine: "Indian",
        difficulty: "Hard",
        cookingTime: 60,
        servings: 6,
        image:
          "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop",
        rating: 4.9,
        reviewCount: 412,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
      {
        title: "Butter Chicken",
        shortDescription:
          "Creamy, tomato-based curry with tender tandoori chicken — India's most loved export.",
        fullDescription:
          "Butter Chicken, or Murgh Makhani, originated in Delhi in the 1950s and has since become the most recognized Indian dish worldwide. Tender chicken pieces, traditionally marinated in yogurt and spices and cooked in a tandoor, are simmered in a luscious sauce of tomatoes, butter, and cream. The result is a mildly spiced, deeply comforting curry that is perfect with naan bread or steamed basmati rice.",
        ingredients: [
          { name: "Chicken thighs", qty: "500", unit: "gram" },
          { name: "Yogurt", qty: "150", unit: "gram" },
          { name: "Tomato puree", qty: "400", unit: "gram" },
          { name: "Heavy cream", qty: "100", unit: "ml" },
          { name: "Butter", qty: "60", unit: "gram" },
          { name: "Ginger-garlic paste", qty: "2", unit: "tbsp" },
          { name: "Garam masala", qty: "1", unit: "tbsp" },
          { name: "Kashmiri red chili", qty: "1", unit: "tbsp" },
          { name: "Fenugreek leaves", qty: "1", unit: "tbsp" },
          { name: "Sugar", qty: "1", unit: "tsp" },
          { name: "Salt", qty: "1", unit: "tsp" },
        ],
        instructions: [
          "Marinate the chicken in yogurt, half the garam masala, Kashmiri chili, and salt for at least 1 hour.",
          "Grill or pan-sear the marinated chicken pieces until charred on the edges. Set aside.",
          "In a heavy-bottomed pan, melt butter and sauté ginger-garlic paste for a minute until fragrant.",
          "Add the tomato puree, remaining garam masala, and sugar. Simmer on medium-low heat for 15 minutes until the sauce thickens and the raw tomato smell disappears.",
          "Stir in the cream and crushed fenugreek leaves. Cook for 2 more minutes.",
          "Add the grilled chicken pieces to the sauce and simmer on low heat for 10 minutes so the chicken absorbs the flavors.",
          "Finish with a pat of butter on top and serve hot with naan or steamed rice.",
        ],
        cuisine: "Indian",
        difficulty: "Medium",
        cookingTime: 40,
        servings: 4,
        image:
          "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&h=600&fit=crop",
        rating: 4.8,
        reviewCount: 367,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
      {
        title: "Masala Dosa",
        shortDescription:
          "A crispy fermented rice-lentil crepe filled with spiced potato — a South Indian staple.",
        fullDescription:
          "Masala Dosa is a beloved South Indian breakfast and snack that has gained fans across the globe. The dosa is a thin, crispy crepe made from a fermented batter of rice and urad dal. It is filled with a spiced potato filling made with mustard seeds, curry leaves, turmeric, and onions. Served with coconut chutney and sambar (a lentil-based vegetable stew), it is a complete, satisfying meal that is both nutritious and delicious.",
        ingredients: [
          { name: "Rice", qty: "300", unit: "gram" },
          { name: "Urad dal", qty: "100", unit: "gram" },
          { name: "Potatoes", qty: "400", unit: "gram" },
          { name: "Onions", qty: "2", unit: "pieces" },
          { name: "Mustard seeds", qty: "1", unit: "tsp" },
          { name: "Curry leaves", qty: "10", unit: "pieces" },
          { name: "Turmeric powder", qty: "0.5", unit: "tsp" },
          { name: "Green chilies", qty: "2", unit: "pieces" },
          { name: "Oil", qty: "3", unit: "tbsp" },
          { name: "Salt", qty: "1", unit: "tsp" },
        ],
        instructions: [
          "Soak rice and urad dal separately in water for 6 hours. Grind to a smooth batter, mix together, add salt, and ferment overnight.",
          "Boil the potatoes, peel, and roughly mash them. Keep aside.",
          "Heat oil in a pan, add mustard seeds and let them splutter. Add curry leaves, sliced onions, and green chilies.",
          "When the onions soften, add turmeric and the mashed potatoes. Mix well, add a splash of water, and cook for 3 minutes.",
          "Heat a flat cast-iron pan or tawa. Pour a ladleful of batter and spread it thin in a circular motion.",
          "Drizzle a little oil around the edges and cook until the bottom is golden and crispy.",
          "Place a spoonful of the potato filling in the center, fold the dosa, and serve with coconut chutney and sambar.",
        ],
        cuisine: "Indian",
        difficulty: "Medium",
        cookingTime: 35,
        servings: 4,
        image:
          "https://images.unsplash.com/photo-1668236543090-82eb5eace084?w=800&h=600&fit=crop",
        rating: 4.6,
        reviewCount: 221,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },

      // --- AMERICAN / MEXICAN ---
      {
        title: "Classic Cheeseburger",
        shortDescription:
          "A juicy, smash-style beef patty with melted cheese, pickles, and special sauce.",
        fullDescription:
          "The American cheeseburger is a cultural icon, and a well-made one is a thing of pure joy. This recipe uses a 80/20 beef-to-fat ratio for maximum juiciness, seasoned simply with salt and pepper and smashed on a hot griddle for that irresistible crust. Topped with melted American cheese, crunchy dill pickles, shredded lettuce, and a tangy special sauce, all on a toasted brioche bun, it is the burger every home cook should master.",
        ingredients: [
          { name: "Ground beef (80/20)", qty: "500", unit: "gram" },
          { name: "American cheese slices", qty: "4", unit: "pieces" },
          { name: "Brioche buns", qty: "4", unit: "pieces" },
          { name: "Dill pickles", qty: "12", unit: "slices" },
          { name: "Iceberg lettuce", qty: "50", unit: "gram" },
          { name: "Tomato", qty: "1", unit: "pieces" },
          { name: "Onion", qty: "1", unit: "pieces" },
          { name: "Mayonnaise", qty: "3", unit: "tbsp" },
          { name: "Ketchup", qty: "2", unit: "tbsp" },
          { name: "Mustard", qty: "1", unit: "tbsp" },
          { name: "Salt and pepper", qty: "1", unit: "tsp" },
        ],
        instructions: [
          "Mix mayonnaise, ketchup, and mustard together to make the special sauce. Set aside.",
          "Divide the ground beef into 4 equal portions and shape into loose balls (do not pack tightly).",
          "Heat a cast-iron skillet or griddle over high heat until smoking. Season the beef balls with salt and pepper.",
          "Place the balls on the griddle and immediately smash flat with a sturdy spatula. Cook for 3 minutes without moving.",
          "Flip the patties, place a cheese slice on each, and cook for 2 more minutes until the cheese melts.",
          "Toast the brioche buns cut-side down on the griddle for 30 seconds.",
          "Assemble the burger: spread sauce on both bun halves, add lettuce, tomato, onion, the patty, and pickles. Serve immediately.",
        ],
        cuisine: "American",
        difficulty: "Easy",
        cookingTime: 20,
        servings: 4,
        image:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
        rating: 4.7,
        reviewCount: 305,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
      {
        title: "BBQ Pulled Pork Sandwich",
        shortDescription:
          "Slow-cooked, smoky pulled pork slathered in tangy barbecue sauce on a soft bun.",
        fullDescription:
          "BBQ Pulled Pork is the undisputed king of American barbecue. A pork shoulder is rubbed with a blend of brown sugar, paprika, garlic, and cumin, then slow-roasted for hours until the meat is so tender it falls apart at the touch of a fork. Shredded and mixed with a tangy, slightly sweet homemade barbecue sauce, it is piled high on a soft brioche bun with a scoop of creamy coleslaw. It is the kind of meal that brings people together.",
        ingredients: [
          { name: "Pork shoulder", qty: "2", unit: "kg" },
          { name: "Brown sugar", qty: "3", unit: "tbsp" },
          { name: "Smoked paprika", qty: "2", unit: "tbsp" },
          { name: "Garlic powder", qty: "1", unit: "tbsp" },
          { name: "Ground cumin", qty: "1", unit: "tbsp" },
          { name: "Apple cider vinegar", qty: "3", unit: "tbsp" },
          { name: "Ketchup", qty: "200", unit: "ml" },
          { name: "Worcestershire sauce", qty: "2", unit: "tbsp" },
          { name: "Brioche buns", qty: "8", unit: "pieces" },
          { name: "Coleslaw", qty: "200", unit: "gram" },
        ],
        instructions: [
          "Mix brown sugar, paprika, garlic powder, cumin, salt, and pepper to make the dry rub.",
          "Pat the pork shoulder dry and coat it generously with the dry rub on all sides.",
          "Place in a roasting pan, cover tightly with foil, and roast at 150°C for 6 hours until the internal temperature reaches 95°C.",
          "While the pork cooks, make the BBQ sauce by simmering ketchup, apple cider vinegar, Worcestershire sauce, and a tablespoon of the dry rub for 20 minutes.",
          "Remove the pork from the oven and let it rest for 20 minutes. Then shred it with two forks, discarding any large pieces of fat.",
          "Toss the shredded pork with the barbecue sauce until evenly coated.",
          "Serve on toasted brioche buns with a generous scoop of coleslaw on top.",
        ],
        cuisine: "American",
        difficulty: "Medium",
        cookingTime: 90,
        servings: 8,
        image:
          "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&h=600&fit=crop",
        rating: 4.8,
        reviewCount: 278,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
      {
        title: "Street-Style Tacos al Pastor",
        shortDescription:
          "Mexican marinated pork tacos with pineapple, cilantro, and onion on soft corn tortillas.",
        fullDescription:
          "Tacos al Pastor are a vibrant Mexican street food inspired by Lebanese immigrants who brought shawarma-style cooking to Mexico. Thinly sliced pork is marinated in a vivid red paste of dried chilies, pineapple, achiote, and spices, then cooked on a vertical spit (or in this case, a hot skillet). The result is charred, caramelized pork with a subtle sweetness, served on warm corn tortillas with diced onion, fresh cilantro, and a squeeze of lime.",
        ingredients: [
          { name: "Pork shoulder", qty: "800", unit: "gram" },
          { name: "Dried guajillo chilies", qty: "4", unit: "pieces" },
          { name: "Achiote paste", qty: "2", unit: "tbsp" },
          { name: "Fresh pineapple", qty: "200", unit: "gram" },
          { name: "White onion", qty: "1", unit: "pieces" },
          { name: "Fresh cilantro", qty: "1", unit: "bunch" },
          { name: "Corn tortillas", qty: "16", unit: "pieces" },
          { name: "Limes", qty: "4", unit: "pieces" },
          { name: "Garlic cloves", qty: "4", unit: "pieces" },
          { name: "White vinegar", qty: "2", unit: "tbsp" },
        ],
        instructions: [
          "Toast the guajillo chilies in a dry pan for 30 seconds per side. Soak in hot water for 15 minutes, then blend with achiote paste, garlic, vinegar, and a splash of pineapple juice.",
          "Slice the pork shoulder into thin strips and coat thoroughly with the marinade. Refrigerate for at least 2 hours (overnight is best).",
          "Dice the pineapple into small pieces. Finely chop the onion and cilantro for garnish.",
          "Heat a cast-iron skillet or grill to high heat. Cook the pork in batches for 3-4 minutes per side until nicely charred.",
          "In the same skillet, grill the pineapple pieces until caramelized.",
          "Warm the corn tortillas on the skillet for 20 seconds per side.",
          "Assemble the tacos: place pork on each tortilla, top with grilled pineapple, diced onion, cilantro, and a generous squeeze of lime juice.",
        ],
        cuisine: "Mexican",
        difficulty: "Medium",
        cookingTime: 35,
        servings: 8,
        image:
          "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop",
        rating: 4.8,
        reviewCount: 294,
        createdBy: demoUserId,
        dietaryTags: [], createdAt: new Date(),
      },
    ];

    await db.collection("recipes").insertMany(recipes);

    console.log("✅ Database Seeded Successfully!");
    console.log(`   → 1 Demo User created (demo@cookmate.com)`);
    console.log(`   → ${recipes.length} Recipes inserted`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedDB();

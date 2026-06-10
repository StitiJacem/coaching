import vision from "@google-cloud/vision";
import axios from "axios";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";


export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PortionSize {
  estimate: "small" | "medium" | "large";
  grams: number;
}

export interface FoodAnalysisResult {
  detectedFoods: string[];
  portion: PortionSize;
  nutrition: NutritionData;
  confidence: "high" | "medium" | "low";
  source: "vision+edamam" | "vision+gemini" | "gemini-only";
}


const GENERIC_FOOD_LABELS = new Set([
  "food",
  "dish",
  "cuisine",
  "meal",
  "ingredient",
  "recipe",
  "cooking",
  "tableware",
  "plate",
  "bowl",
  "serving",
  "snack",
  "lunch",
  "dinner",
  "breakfast",
  "appetizer",
  "drink",
  "beverage",
  "fast food",
  "junk food",
  "street food",
  "comfort food",
  "produce",
  "vegetarian food",
  "vegan nutrition",
  "organic food",
  "whole food",
  "natural food",
  "staple food",
  "finger food",
  "garnish",
  "side dish",
  "main course",
  "cuisine",
  "baked goods",
]);


async function detectFoodLabelsWithVision(imageBuffer: Buffer): Promise<string[]> {
  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    path.resolve(__dirname, "../../gosport-ai-credentials.json");

  console.log(`[AIService][Vision] Using credentials from: ${credentialsPath}`);

  const client = new vision.ImageAnnotatorClient({
    keyFilename: credentialsPath,
  });

  const [result] = await client.labelDetection({ image: { content: imageBuffer } });
  const labels = result.labelAnnotations ?? [];

  console.log(
    `[AIService][Vision] Raw labels (${labels.length}):`,
    labels.map((l) => `${l.description} (${((l.score ?? 0) * 100).toFixed(0)}%)`).join(", ")
  );

  const filtered = labels
    .filter((l) => (l.score ?? 0) >= 0.7 && !GENERIC_FOOD_LABELS.has((l.description ?? "").toLowerCase()))
    .map((l) => (l.description ?? "").toLowerCase().trim())
    .filter((name) => name.length > 0);

  console.log(`[AIService][Vision] Filtered food labels: [${filtered.join(", ")}]`);
  return filtered;
}


interface EdamamHint {
  food: {
    label: string;
    nutrients: {
      ENERC_KCAL?: number;
      PROCNT?: number;
      CHOCDF?: number;
      FAT?: number;
    };
  };
  measures?: { label: string; weight: number }[];
}

async function fetchNutritionFromEdamam(
  foodItems: string[],
  portionGrams: number
): Promise<NutritionData> {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("EDAMAM_APP_ID or EDAMAM_APP_KEY is not configured.");
  }

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let foundCount = 0;

  for (const food of foodItems) {
    try {
      const url = `https://api.edamam.com/api/food-database/v2/parser`;
      const response = await axios.get(url, {
        params: {
          "app_id": appId,
          "app_key": appKey,
          "ingr": food,
          "nutrition-type": "cooking",
        },
        timeout: 10_000,
      });

      const hints: EdamamHint[] = response.data?.hints ?? [];
      if (hints.length === 0) {
        console.warn(`[AIService][Edamam] No results for: "${food}"`);
        continue;
      }

      const best = hints[0].food.nutrients;

      const portionShare = portionGrams / foodItems.length;
      const scaleFactor = portionShare / 100;

      totalCalories += (best.ENERC_KCAL ?? 0) * scaleFactor;
      totalProtein += (best.PROCNT ?? 0) * scaleFactor;
      totalCarbs += (best.CHOCDF ?? 0) * scaleFactor;
      totalFat += (best.FAT ?? 0) * scaleFactor;
      foundCount++;

      console.log(
        `[AIService][Edamam] "${food}": ${((best.ENERC_KCAL ?? 0) * scaleFactor).toFixed(0)} kcal (portion share: ${portionShare}g)`
      );
    } catch (err: any) {
      console.warn(`[AIService][Edamam] Failed to query "${food}":`, err.message);
    }
  }

  if (foundCount === 0) {
    throw new Error("Edamam returned no nutritional data for any detected food item.");
  }

  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat),
  };
}


async function estimateNutritionWithGemini(
  foodItems: string[],
  portionGrams: number
): Promise<NutritionData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }, { apiVersion: "v1beta" });

  const foodList = foodItems.join(", ");
  const prompt =
    `Estimate the nutritional content for a meal containing: ${foodList}. ` +
    `Total portion size is approximately ${portionGrams}g. ` +
    `Return ONLY a valid JSON object with these keys: calories (number), protein (number), carbs (number), fat (number). ` +
    `Values must be for the total portion, in kcal/grams. No markdown, no extra text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini nutrition fallback: invalid response format.");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      calories: Math.round(Number(parsed.calories) || 0),
      protein: Math.round(Number(parsed.protein) || 0),
      carbs: Math.round(Number(parsed.carbs) || 0),
      fat: Math.round(Number(parsed.fat) || 0),
    };
  } catch (err: any) {
    console.error("[AIService][Gemini] Text analysis failed:", err.message);
    throw err;
  }
}

async function analyzeFullImageWithGemini(
  imageBuffer: Buffer,
  mimeType: string
): Promise<FoodAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }, { apiVersion: "v1beta" });

  const prompt =
    `Act as a nutrition expert. Analyze this food image and return a JSON object with:
    - detectedFoods: list of specific food items (e.g. ["Grilled Salmon", "Steamed Asparagus"])
    - portion: { estimate: "small" | "medium" | "large", grams: estimated_weight_in_grams }
    - nutrition: { calories: total_kcal, protein: total_grams, carbs: total_grams, fat: total_grams }
    - confidence: "high" | "medium" | "low" based on visual clarity
    - source: constant string "gemini-only"
    
    Return ONLY the raw JSON object. No markdown, no extra text.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const rawText = response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini full fallback: invalid response format.");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      detectedFoods: Array.isArray(parsed.detectedFoods) ? parsed.detectedFoods : [],
      portion: {
        estimate: parsed.portion?.estimate || "medium",
        grams: Number(parsed.portion?.grams) || 300,
      },
      nutrition: {
        calories: Math.round(Number(parsed.nutrition?.calories) || 0),
        protein: Math.round(Number(parsed.nutrition?.protein) || 0),
        carbs: Math.round(Number(parsed.nutrition?.carbs) || 0),
        fat: Math.round(Number(parsed.nutrition?.fat) || 0),
      },
      confidence: parsed.confidence || "medium",
      source: "gemini-only",
    };
  } catch (err: any) {
    console.error("[AIService][Gemini] Image analysis failed:", err.message);
    throw err;
  }
}



function estimatePortion(foodCount: number): PortionSize {
  if (foodCount <= 1) return { estimate: "small", grams: 150 };
  if (foodCount <= 3) return { estimate: "medium", grams: 300 };
  return { estimate: "large", grams: 500 };
}




export async function analyzeFoodImage(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<FoodAnalysisResult> {
  console.log(
    `[AIService] Starting analysis — image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`
  );


  let detectedFoods: string[] = [];
  let useFullGeminiFallback = false;

  try {
    detectedFoods = await detectFoodLabelsWithVision(imageBuffer);
  } catch (visionErr: any) {
    console.error(
      "[AIService] Vision API error:",
      visionErr.message,
      "— falling back to full Gemini analysis."
    );
    useFullGeminiFallback = true;
  }

  if (useFullGeminiFallback) {
    try {
      const geminiResult = await analyzeFullImageWithGemini(imageBuffer, mimeType);
      console.log("[AIService] Full analysis resolved via Gemini (Vision API was unavailable).");
      return geminiResult;
    } catch (geminiFullErr: any) {
      console.error("[AIService] Full Gemini fallback also failed:", geminiFullErr.message);
      throw new Error("Food analysis failed: Both Vision and Gemini services were unavailable.");
    }
  }

  if (detectedFoods.length === 0) {
    console.warn("[AIService] Vision API found no specific food labels.");
    return {
      detectedFoods: [],
      portion: { estimate: "medium", grams: 0 },
      nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      confidence: "low",
      source: "vision+edamam",
    };
  }

  const portion = estimatePortion(detectedFoods.length);
  console.log(`[AIService] Portion estimate: ${portion.estimate} (${portion.grams}g)`);

  let nutrition: NutritionData;
  let source: FoodAnalysisResult["source"] = "vision+edamam";

  const hasEdamam = !!(process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY);

  if (hasEdamam) {
    try {
      nutrition = await fetchNutritionFromEdamam(detectedFoods, portion.grams);
      console.log("[AIService] Nutrition resolved via Edamam.");
    } catch (edamamErr: any) {
      console.warn("[AIService] Edamam failed:", edamamErr.message, "— falling back to Gemini.");
      source = "vision+gemini";
      nutrition = await estimateNutritionWithGemini(detectedFoods, portion.grams);
    }
  } else {
    console.warn("[AIService] Edamam not configured — using Gemini for nutrition estimation.");
    source = "vision+gemini";
    nutrition = await estimateNutritionWithGemini(detectedFoods, portion.grams);
  }

  const confidence: FoodAnalysisResult["confidence"] =
    detectedFoods.length >= 3 ? "high" : detectedFoods.length === 2 ? "medium" : "low";

  console.log(
    `[AIService] Done — foods: [${detectedFoods.join(", ")}] | ` +
    `${nutrition.calories} kcal | confidence: ${confidence} | source: ${source}`
  );

  return { detectedFoods, portion, nutrition, confidence, source };
}

export function filterGenericLabels(foods: string[]): string[] {
  return foods
    .map((f) => f.toLowerCase().trim())
    .filter((f) => f.length > 0 && !GENERIC_FOOD_LABELS.has(f));
}

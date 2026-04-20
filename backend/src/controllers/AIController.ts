import { Request, Response } from "express";
import axios from "axios";

export class AIController {
    static analyzeFood = async (req: Request, res: Response) => {
        try {
            const { image } = req.body; // Base64 string
            if (!image) {
                return res.status(400).json({ message: "No image provided" });
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.error("GEMINI_API_KEY is not set");
                return res.status(500).json({ message: "AI Analysis currently unavailable (API key missing)" });
            }

            // Clean the base64 string if it contains the prefix
            const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

            const prompt = "Identify the food in this image and estimate its protein, carbs, and fats in grams, and total calories per portion. Return ONLY a valid JSON object with these keys: foodName (string), calories (number), protein (number), carbs (number), fats (number). Do not include any other text or markdown formatting.";

            const response = await axios.post(geminiUrl, {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Data
                            }
                        }
                    ]
                }]
            });

            const resultText = response.data.candidates[0].content.parts[0].text;
            
            // Extract JSON from the response (in case Gemini adds markdown backticks)
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error("Could not parse JSON from Gemini response:", resultText);
                return res.status(500).json({ message: "Failed to parse AI response" });
            }

            const nutritionData = JSON.parse(jsonMatch[0]);
            res.json(nutritionData);

        } catch (error: any) {
            console.error("AI Analysis Error:", error.response?.data || error.message);
            res.status(500).json({ message: "Error during AI food analysis" });
        }
    };
}

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing API Key:", apiKey.substring(0, 8) + "...");
  
  try {
    // We use raw fetch because the SDK doesn't have a clean listModels in all versions
    const axios = require('axios');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    
    console.log("\n✅ Modèles disponibles pour votre clé :");
    response.data.models.forEach(m => {
      console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
    });
  } catch (err) {
    console.error("\n❌ Erreur lors de la récupération des modèles :");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data));
    } else {
      console.error(err.message);
    }
  }
}

listModels();

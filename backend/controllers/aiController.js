const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Generate a trip itinerary using Gemini
// @route   POST /api/ai/plan
exports.generateItinerary = async (req, res) => {
  try {
    const { destination, duration, budget } = req.body;

    if (!destination || !duration || !budget) {
      return res.status(400).json({ message: "Please provide destination, duration, and budget." });
    }

    // Using the stable, fast flash model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      // This forces the AI to ONLY return valid JSON
      generationConfig: { responseMimeType: "application/json" }
    });

    // The Master Prompt
    const prompt = `
      You are an expert travel planner. Create a highly structured daily itinerary for a trip to ${destination} for ${duration} days, keeping the budget level at '${budget}'. 
      
      Requirements:
      1. Provide a realistic day-by-day breakdown including morning, afternoon, and evening activities.
      2. Recommend specific realistic places to visit or eat.
      3. For each day, provide a realistic estimated cost range in INR (₹) considering the '${budget}' budget level. Include transport, food, and entry fees. Do NOT include flights.
      4. At the end, provide a total estimated trip cost range in INR (₹) that sums up the daily costs.

      Return the response STRICTLY using this exact JSON schema:
      {
        "tripDetails": {
          "destination": "String",
          "duration": "String",
          "budget": "String"
        },
        "totalEstimatedCost": "String (e.g., ₹15,000 - ₹20,000)",
        "itinerary": [
          {
            "day": Number,
            "theme": "String (e.g., Arrival & Beach Hopping)",
            "morning": "String",
            "afternoon": "String",
            "evening": "String",
            "dailyCost": "String (e.g., ₹2,000 - ₹3,000)"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON string back into a real JavaScript object
    const itineraryData = JSON.parse(responseText);

    res.status(200).json(itineraryData);
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ message: "Failed to generate itinerary. Please try again." });
  }
};

// @desc    Scan a receipt image and extract details using Gemini Vision
// @route   POST /api/ai/scan
exports.scanReceipt = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: "No image provided." });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Analyze this receipt image carefully. Extract the name of the establishment (or a short, logical description of the expense) as the 'title'. Extract the final total amount paid as a number 'amount'.
      
      Return the response STRICTLY using this exact JSON schema:
      {
        "title": "String (e.g., Starbucks)",
        "amount": Number (e.g., 450)
      }
    `;

    // Gemini requires the image formatted like this
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // THE MAGIC FIX: Strip away any Markdown formatting Gemini tries to add!
    const cleanText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // Now it is perfectly safe to parse
    const receiptData = JSON.parse(cleanText);

    res.status(200).json(receiptData);
  } catch (error) {
    console.error("Receipt Scan Error:", error);
    res.status(500).json({ message: "Failed to scan receipt. Please try again." });
  }
};
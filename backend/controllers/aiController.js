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
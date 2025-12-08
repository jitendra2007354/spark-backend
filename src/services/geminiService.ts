import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from "@google/generative-ai";

// Use Node.js method for accessing environment variables
const apiKey = process.env.GEMINI_API_KEY;

// --- Safety Check ---
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set. Please add it to your .env file.");
}

// Define the system prompt once
const systemInstruction = `
  You are an expert admin assistant for a ride-sharing app called "Spark".
  Your primary role is to provide quick, data-driven insights to the admin to help them manage the platform effectively.
  You can only answer questions based on the data provided to you in this prompt. You cannot access the database directly.
  
  When you suggest an action, you MUST format it as a JSON object within the response.
  Example: "Here are the users with a low rating. {"type":"FLAG_USERS","payload":["user_id_1","user_id_2"]}"

  Available Action Types: [FLAG_USERS, SEND_NOTIFICATION, NONE]
`;

// Initialize the AI model only if the key is available
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// FINAL FIX: Changed to the universally available 'gemini-pro' model.
const model = genAI 
  ? genAI.getGenerativeModel({ 
      model: "gemini-pro", // Use the standard, widely available 'gemini-pro' model
    })
  : null;

const generationConfig = {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * This function communicates DIRECTLY with the Google AI service from the frontend.
 */
export const getAdminInsights = async (prompt: string, history: Content[], userData: any) => {
  if (!model) {
    return {
      text: "AI Assistant is disabled. The GEMINI_API_KEY is not configured in your .env file.",
      action: { type: 'NONE' },
    };
  }

  try {
    const validHistory = history.filter(message => message.role === 'user' || (message.role === 'model' && history.some(h => h.role === 'user')) );

    const chat = model.startChat({ 
        history: validHistory, 
        generationConfig,
        safetySettings,
    });

    // The gemini-pro model prefers the user prompt to be part of the message history
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const responseText = response.text();

    let text = responseText;
    let action = { type: 'NONE' };

    const actionMatch = responseText.match(/{[sS]*}/);
    if (actionMatch) {
        try {
            const parsedAction = JSON.parse(actionMatch[0]);
            if (parsedAction.type) {
                action = parsedAction;
                text = responseText.replace(actionMatch[0], '').trim();
            }
        } catch (e) {
            console.error("Failed to parse AI action JSON:", e);
        }
    }

    return { text, action };

  } catch (error: any) {
      console.error("Error calling Gemini API directly:", error);
      return {
          text: `An error occurred while communicating with the AI service: ${error.message}`,
          action: { type: 'NONE' }
      };
  }
};
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// API Keys - try with the new API key from the Python example
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCXA0NIKhioAXSxHtLThqEY1xDrJhjWCO0';

console.log("Using Gemini API key:", GEMINI_API_KEY.substring(0, 10) + "...");

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Model configuration
const MODEL_NAME = 'gemini-2.0-flash'; // Use the model from the Python example

// Store conversation history
const conversationHistory = new Map();

/**
 * Process a query with Google's Gemini API
 */
export const processWithGemini = async (
  query: string,
  conversationId: string,
  options: {
    relevantInfo?: string;
    userHistory?: string;
  } = {}
): Promise<string> => {
  try {
    console.log(`Processing query with model: ${MODEL_NAME}`);

    // Get the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Get or create conversation history
    if (!conversationHistory.has(conversationId)) {
      conversationHistory.set(conversationId, []);
    }
    
    const history = conversationHistory.get(conversationId);
    
    // Add context
    let prompt = query;
    if (options.relevantInfo) {
      prompt = `Context: ${options.relevantInfo}\n\nUser query: ${query}`;
    }
    
    // Direct generation approach (like the Python example)
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Store the interaction
    history.push({ query, response });
    
    return response;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // For development, use a fallback response when API fails
    return "I'm having trouble connecting to my knowledge system right now. As a fallback, I can tell you that ERP systems typically include modules for finance, HR, supply chain, and customer management. What specific area are you interested in?";
  }
};

/**
 * Process with advanced features (for complex queries)
 */
export const processWithAdvancedGemini = async (
  query: string,
  conversationId: string,
  options: {
    relevantInfo?: string;
    userHistory?: string;
    detectedIntent?: string;
  } = {}
): Promise<string> => {
  // For now, just delegate to the standard processor
  return processWithGemini(query, conversationId, options);
}; 
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult, PropertyType, LoanPurpose, RatePreference, UserContext } from '../types';

// Safe Env Access
const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {}
  return ''; 
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: getApiKey() });
const modelName = 'gemini-2.5-flash';

// --- System Instructions ---

const EXTRACTION_SYSTEM_PROMPT = `
You are the logic engine for Dexter.
Your ONLY job is to extract mortgage entities from the user's input.
Output JSON only. No conversation.

Entities:
1. propertyType: "HDB" or "Private".
2. loanSize: number (SGD).
3. loanPurpose: "New Purchase" or "Refinance".
4. ratePreference: "Fixed" or "Floating".

Intent:
- "exploratory": Just browsing.
- "direct": Asks for specific deals.
- "mixed": Vague but has some intent.
`;

const CONVERSATION_SYSTEM_PROMPT = `
You are Dexter AI, a Senior Mortgage Broker from "The Loan Connection". 
Your tone is professional, concise, and empathetic. 
You rely on the provided context to guide the user.
Keep responses under 100 words unless explaining a complex concept.

VOICE & TONE GUIDELINES:
1. **Be a Consultant, Not a Form**: Don't just ask "What is your loan size?". Say "To find the best tier for you, could you share the estimated loan amount?"
2. **No Robot Talk**: Never say "As an AI" or "I am a bot". 
3. **Singapore Context**: Use local terms naturally (HDB, SORA, Lock-in).
4. **Validation**: If a user gives a high loan amount (e.g., >1M), subtly acknowledge it ("Understood, for that volume, we can look at premier tiers...").
5. **Logic First**: If the user asks for something impossible (e.g., Fixed rates for 20 years), politely explain that in Singapore, fixed rates usually last 2-3 years.

YOUR CURRENT GOAL:
Guide the user to the right loan package by gathering the 4 pillars of mortgage facts: Property Type, Loan Amount, Purpose, and Rate Preference.
`;

// --- API Functions ---

export const extractIntentAndEntities = async (
  userMessage: string,
  currentContext: UserContext
): Promise<ExtractionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Current Context: ${JSON.stringify(currentContext)}. User Input: "${userMessage}"`,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            propertyType: { type: Type.STRING, enum: [PropertyType.HDB, PropertyType.PRIVATE, PropertyType.UNKNOWN] },
            loanSize: { type: Type.NUMBER },
            loanPurpose: { type: Type.STRING, enum: [LoanPurpose.NEW_PURCHASE, LoanPurpose.REFINANCE, LoanPurpose.UNKNOWN] },
            ratePreference: { type: Type.STRING, enum: [RatePreference.FIXED, RatePreference.FLOATING, RatePreference.UNKNOWN] },
            intent: { type: Type.STRING, enum: ['exploratory', 'direct', 'mixed'] },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ExtractionResult;
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return {
      intent: 'mixed',
      reasoning: 'Fallback due to error',
    };
  }
};

export const generateAssistantResponse = async (
  userMessage: string,
  state: string,
  missingFields: string[],
  context?: UserContext
): Promise<string> => {
  let specificInstruction = "";
  
  if (state === 'FACT_FINDING') {
    specificInstruction = `
      The user is missing: ${missingFields.join(', ')}. 
      Context so far: ${JSON.stringify(context)}.
      Task: Acknowledge what they just said warmly, then pivot to asking ONE (or max two) of the missing fields.
      Example: "That's a good start. To ensure we check the right eligibility rules, is this for an HDB flat or a Private property?"
    `;
  } else if (state === 'HANDOVER') {
    specificInstruction = "The user has seen the packages or requested help. Close gently and mention that the button below connects directly to a human specialist for complex handling.";
  } else {
    specificInstruction = "The user is asking a general question. Answer professionally using Singapore mortgage knowledge (SORA, FHR, etc).";
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userMessage,
      config: {
        systemInstruction: `${CONVERSATION_SYSTEM_PROMPT}\n\nCURRENT TASK: ${specificInstruction}`
      }
    });
    return response.text || "I apologize, I'm having trouble connecting to the market data. Please try again.";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return "I can help with that. Could you clarify if you are looking at HDB or Private property?";
  }
};
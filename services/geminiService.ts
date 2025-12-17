import {
  ExtractionResult,
  PropertyType,
  LoanPurpose,
  RatePreference,
  UserContext,
} from "../types";

/* ------------------------------------
   SYSTEM PROMPTS
------------------------------------ */

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
1. Be a Consultant, Not a Form
2. No Robot Talk
3. Singapore Context (HDB, SORA, Lock-in)
4. Validation for large loan sizes
5. Logic First
`;

/* ------------------------------------
   BACKEND CALL HELPER
------------------------------------ */

async function callGeminiBackend(payload: any) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Gemini backend failed");
  }

  return res.json();
}

/* ------------------------------------
   CHEAP LOCAL PARSING (NO GEMINI)
------------------------------------ */

function quickParse(
  message: string,
  context: UserContext
): UserContext {
  const m = message.toLowerCase();

  // Property Type
  if (!context.propertyType) {
    if (m.includes("hdb")) context.propertyType = PropertyType.HDB;
    if (
      m.includes("private") ||
      m.includes("condo") ||
      m.includes("landed")
    ) {
      context.propertyType = PropertyType.PRIVATE;
    }
  }

  // Loan Purpose
  if (!context.loanPurpose) {
    if (m.includes("refinance")) {
      context.loanPurpose = LoanPurpose.REFINANCE;
    }
    if (m.includes("buy") || m.includes("purchase")) {
      context.loanPurpose = LoanPurpose.NEW_PURCHASE;
    }
  }

  // Rate Preference
  if (!context.ratePreference) {
    if (m.includes("fixed")) {
      context.ratePreference = RatePreference.FIXED;
    }
    if (m.includes("floating") || m.includes("sora")) {
      context.ratePreference = RatePreference.FLOATING;
    }
  }

  return context;
}

/* ------------------------------------
   EXTRACT INTENT & ENTITIES
------------------------------------ */

export const extractIntentAndEntities = async (
  userMessage: string,
  currentContext: UserContext
): Promise<ExtractionResult> => {

  // 1️⃣ Cheap local parse first
  const updatedContext = quickParse(
    userMessage,
    { ...currentContext }
  );

  const contextComplete =
    updatedContext.propertyType &&
    updatedContext.loanPurpose &&
    updatedContext.ratePreference;

  // 2️⃣ If context already sufficient, skip Gemini
  if (contextComplete) {
    return {
      intent: "direct",
      reasoning: "Context already sufficient",
      ...updatedContext,
    } as ExtractionResult;
  }

  // 3️⃣ Use Gemini ONLY when needed
  try {
    const data = await callGeminiBackend({
      contents: `Current Context: ${JSON.stringify(
        currentContext
      )}. User Input: "${userMessage}"`,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    if (!data.text) throw new Error("Empty Gemini response");

    return JSON.parse(data.text) as ExtractionResult;
  } catch (error) {
    console.error("Extraction failed:", error);
    return {
      intent: "mixed",
      reasoning: "Fallback due to error",
    };
  }
};

/* ------------------------------------
   GENERATE ASSISTANT RESPONSE
------------------------------------ */

export const generateAssistantResponse = async (
  userMessage: string,
  state: string,
  missingFields: string[],
  context?: UserContext
): Promise<string> => {

  let specificInstruction = "";

  if (state === "FACT_FINDING") {
    specificInstruction = `
The user is missing: ${missingFields.join(", ")}.
Context so far: ${JSON.stringify(context)}.
Task: Acknowledge warmly, then ask ONLY ONE missing field.
`;
  } else if (state === "HANDOVER") {
    specificInstruction =
      "Close gently and mention that the button below connects to a human specialist.";
  } else {
    specificInstruction =
      "Answer professionally using Singapore mortgage knowledge.";
  }

  try {
    const data = await callGeminiBackend({
      contents: userMessage,
      config: {
        systemInstruction:
          `${CONVERSATION_SYSTEM_PROMPT}\n\nCURRENT TASK:\n${specificInstruction}`,
      },
    });

    return (
      data.text ||
      "I’m having trouble accessing market data at the moment. Please try again shortly."
    );
  } catch (error) {
    console.error("Assistant generation failed:", error);
    return (
      "I’m receiving a high number of requests right now. " +
      "Please give me a few seconds and try again."
    );
  }
};

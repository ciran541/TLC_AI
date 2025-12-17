import { GoogleGenAI } from "@google/genai";

const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function generateWithResilience(
  ai: GoogleGenAI,
  contents: any,
  config: any,
  retries = 2
) {
  let lastError: any;

  for (const model of MODEL_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return response;
    } catch (err: any) {
      lastError = err;

      // Retry only on overload
      if (
        err?.message?.includes("overloaded") ||
        err?.message?.includes("UNAVAILABLE")
      ) {
        if (retries > 0) {
          console.warn(`🔁 ${model} overloaded, retrying...`);
          await sleep(800);
          return generateWithResilience(ai, contents, config, retries - 1);
        }
      }

      console.warn(`⚠️ Model ${model} failed, trying next`);
    }
  }

  throw lastError;
}

export default async function handler(req: any, res: any) {
  console.log("🔵 API /api/gemini HIT");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔵 API key exists:", !!process.env.API_KEY);

    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY!,
    });

    const { contents, config } = req.body;

    const response = await generateWithResilience(
      ai,
      contents,
      config
    );

    console.log("🟢 Gemini response success");

    res.status(200).json({
      text: response.text,
    });
  } catch (error: any) {
    console.error("🔴 Gemini failed after all fallbacks:", error?.message);

    // Graceful user-facing message
    res.status(200).json({
      text:
        "I’m experiencing unusually high demand at the moment. " +
        "Please give me a few seconds and try again.",
    });
  }
}

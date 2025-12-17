import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  console.log("🔵 API /api/gemini HIT");

  if (req.method !== "POST") {
    console.log("🟡 Wrong HTTP method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔵 Checking API key exists:", !!process.env.API_KEY);

    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY!,
    });

    const { model, contents, config } = req.body;

    console.log("🔵 Request payload received:", {
      model,
      hasContents: !!contents,
      hasConfig: !!config,
    });

    const response = await ai.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents,
      config,
    });

    console.log("🟢 Gemini response received");

    res.status(200).json({
      text: response.text,
    });
  } catch (error: any) {
    console.error("🔴 Gemini backend error:", error?.message || error);
    res.status(500).json({ error: "Gemini failed" });
  }
}

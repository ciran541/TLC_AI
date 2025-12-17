import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY!,
    });

    const { model, contents, config } = req.body;

    const response = await ai.models.generateContent({
      model: model || "gemini-2.5-flash",
      contents,
      config,
    });

    res.status(200).json({
      text: response.text,
    });
  } catch (error) {
    console.error("Gemini backend error:", error);
    res.status(500).json({ error: "Gemini failed" });
  }
}

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const generateWithGemini = async (
  systemInstruction: string,
  userPrompt: string,
  modelName: string = "gemini-3-flash-preview",
  responseMimeType: string = "text/plain",
  responseSchema?: any
): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType,
        responseSchema,
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

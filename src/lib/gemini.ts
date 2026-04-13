import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function enhancePrompt(prompt: string): Promise<string> {
  if (!prompt.trim()) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert prompt engineer for AI image generators like Midjourney and Stable Diffusion. 
      Your task is to take a simple user prompt and expand it into a highly detailed, descriptive, and artistic prompt that will produce a stunning image.
      
      User Prompt: "${prompt}"
      
      Requirements:
      - Add details about lighting, texture, composition, and mood.
      - Use descriptive adjectives.
      - Keep it under 75 words.
      - Output ONLY the enhanced prompt text. No explanations or quotes.`,
    });
    
    return response.text?.trim() || prompt;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return prompt;
  }
}

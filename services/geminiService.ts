import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, MessageRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateGeminiResponse = async (
  history: ChatMessage[],
  projectContext: any,
  newMessage: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Construct a context-aware prompt
    const contextString = projectContext 
      ? `CURRENT PROJECT JSON CONTEXT:\n\`\`\`json\n${JSON.stringify(projectContext, null, 2)}\n\`\`\`\n\n` 
      : "NO PROJECT CONTEXT LOADED.\n\n";

    const systemInstruction = `You are a Senior Frontend React Engineer assisting a user in continuing a project. 
    ${contextString}
    Analyze the provided JSON context (if any) to understand the current state of the application.
    Provide code snippets, architecture advice, or data analysis based on this context.
    Be concise, professional, and helpful.`;

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })).filter(msg => msg.role !== 'system'), // Filter out internal system messages if any
    });

    const result: GenerateContentResponse = await chat.sendMessage({
        message: newMessage
    });

    return result.text || "No response generated.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with Gemini. Please check your API Key and connection.");
  }
};
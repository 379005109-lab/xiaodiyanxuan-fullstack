import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateHealthAdvice = async (query: string): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure the environment.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: "你是一个专业的家居搭配顾问，服务于'ZenLife'高端家具商城。你的目标是帮助用户挑选适合他们家庭风格的家具（沙发、灯具、桌椅等），提供配色建议和材质说明。请用中文回答，语气专业、优雅且亲切。回答控制在100字以内。",
      }
    });
    return response.text || "抱歉，我现在无法提供建议。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，网络连接似乎有点问题。";
  }
};

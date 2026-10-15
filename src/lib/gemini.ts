import { GoogleGenerativeAI } from "@google/generative-ai";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return key;
}

function getModelName() {
  return process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
}

export function getGeminiModel() {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({ model: getModelName() });
}

export async function askGemini(
  prompt: string,
  systemContext?: string
): Promise<string> {
  const model = getGeminiModel();
  const fullPrompt = systemContext
    ? `${systemContext}\n\nUser: ${prompt}`
    : prompt;

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text();
  return text.trim() || "I couldn't generate a response.";
}

export async function pingGemini() {
  const text = await askGemini(
    "Reply with exactly: GEMINI_OK",
    "You are a connection test. Respond briefly."
  );
  return text;
}

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const personaAgent = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
});

export async function generatePersona(scenario: string) {
  const res = await personaAgent.invoke([
    ["system", "You are a persona generator for training customer agents."],
    ["user", `Generate a customer persona for scenario: ${scenario}`],
  ]);
  return res.content;  // e.g. { persona: "...", traits: "...", mood: "..." }
}

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const customerAgent = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-pro",
  });
  
  export async function customerReply(persona: string, traineeMessage: string) {
    const res = await customerAgent.invoke([
      ["system", `You are roleplaying as this persona: ${persona}`],
      ["user", traineeMessage],
    ]);
    return res.content;
  }
  
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const supervisorAgent = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-pro",
  });
  
  export async function evaluateResponse(persona: string, traineeMessage: string) {
    const res = await supervisorAgent.invoke([
      ["system", "You are a supervisor giving feedback to a trainee."],
      ["user", `The trainee responded: "${traineeMessage}".
       Persona: ${persona}.
       Give a short score (0-10) and constructive feedback.`],
    ]);
    return res.content;
  }
  
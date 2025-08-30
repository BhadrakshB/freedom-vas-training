// lib/llm.ts
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";


export const supervisorLLM = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_DIALOGUE_MODEL ?? "gemini-1.5-pro",
    temperature: Number(process.env.SUPERVISOR_TEMPERATURE ?? 0),
});


export const customerLLM = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_DIALOGUE_FAST ?? "gemini-1.5-flash",
    temperature: Number(process.env.CUSTOMER_TEMPERATURE ?? 0.6),
});


export const embeddings = new GoogleGenerativeAIEmbeddings({
    model: process.env.GEMINI_EMBEDDING_MODEL ?? "models/embedding-001",    
});
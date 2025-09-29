// lib/llm.ts
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";


export const feedbackLLM = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_DIALOGUE_MODEL ?? "gemini-2.0-flash",
    temperature: Number(process.env.SUPERVISOR_TEMPERATURE ?? 0.5),
});


export const customerLLM = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_DIALOGUE_FAST ?? "gemini-2.0-flash",
    temperature: Number(process.env.CUSTOMER_TEMPERATURE ?? 0.7),
});

export const scenarioLLM = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_DIALOGUE_FAST ?? "gemini-2.0-flash",
    temperature: Number(process.env.CUSTOMER_TEMPERATURE ?? 0.8),
});

export const personaLLM = new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_DIALOGUE_FAST ?? "gemini-2.0-flash",
    temperature: Number(process.env.CUSTOMER_TEMPERATURE ?? 0.9),
});

export const embeddings = new GoogleGenerativeAIEmbeddings({
    model: process.env.GEMINI_EMBEDDING_MODEL ?? "models/embedding-001",
});
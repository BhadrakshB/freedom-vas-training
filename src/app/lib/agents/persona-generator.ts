import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TrainingState } from "../training-state";

export async function personaGenerator(state: typeof TrainingState.State) {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY!,
  });
  
  const prompt = `
You are a character designer for STR training simulations.
Create a detailed persona for this scenario:
${state.scenario.description}

Guidelines:
- Create realistic backgrounds
- Include hidden motivations
- Define emotional progression
- Specify communication style

CRITICAL: Output MUST be valid JSON with these exact fields:
- name: First and last name
- background: Brief bio
- personality_traits: Array of traits
- hidden_motivations: Array of motivations
- communication_style: Description
- emotional_arc: Array of emotional states

Example output format:
{
  "name": "Alex Chen",
  "background": "34-year-old sales executive who missed flight",
  "personality_traits": ["impatient", "tech-savvy", "price-sensitive"],
  "hidden_motivations": ["hoping for discount", "needs early check-in"],
  "communication_style": "Direct, slightly frustrated tone",
  "emotional_arc": ["frustrated", "hopeful", "satisfied"]
}
  `;
  
  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    
    // Attempt to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const persona = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      name: "Guest",
      background: "",
      personality_traits: [],
      hidden_motivations: [],
      communication_style: "standard",
      emotional_arc: ["neutral"]
    };
    
    return {
      persona: {
        name: persona.name || "Guest",
        background: persona.background || "",
        personality_traits: persona.personality_traits || [],
        hidden_motivations: persona.hidden_motivations || [],
        communication_style: persona.communication_style || "standard",
        emotional_arc: persona.emotional_arc || ["neutral"],
      },
      current_emotion: persona.emotional_arc?.[0] || "neutral",
      next: "guest_simulator"
    };
  } catch (error) {
    console.error("Persona generation failed:", error);
    return {
      persona: {
        name: "Default Guest",
        background: "Generic guest scenario",
        personality_traits: ["standard"],
        hidden_motivations: [],
        communication_style: "standard",
        emotional_arc: ["neutral"]
      },
      current_emotion: "neutral",
      next: "guest_simulator"
    };
  }
}
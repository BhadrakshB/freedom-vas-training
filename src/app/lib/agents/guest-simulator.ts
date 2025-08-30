import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage } from "@langchain/core/messages";
import { TrainingState } from "../training-state";

// Helper to normalize Gemini output
function asText(ai: { content: unknown }): string {
  if (typeof ai.content === "string") return ai.content;
  if (Array.isArray(ai.content)) {
    return ai.content
      .map((p) => {
        if (typeof p === 'string') return p;
        if (typeof p === 'object' && p && 'text' in p && typeof p.text === 'string') {
          return p.text;
        }
        return '';
      })
      .join(" ")
      .trim();
  }
  return "";
}

export async function guestSimulator(state: typeof TrainingState.State) {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY!,
    temperature: 0.7, // More creative for roleplay
  });
  
  // Determine emotional shift
  let newEmotion = state.current_emotion;
  const emotionIndex = state.persona.emotional_arc.indexOf(state.current_emotion);
  if (emotionIndex !== -1 && emotionIndex < state.persona.emotional_arc.length - 1) {
    // 50% chance to progress emotional state
    if (Math.random() > 0.5) {
      newEmotion = state.persona.emotional_arc[emotionIndex + 1];
    }
  }
  
  const prompt = `
You are ${state.persona.name}, ${state.persona.background}.
Personality traits: ${state.persona.personality_traits.join(", ")}
Hidden motivations: ${state.persona.hidden_motivations.join(", ")}
Current emotional state: ${newEmotion}
Communication style: ${state.persona.communication_style}

Scenario context: ${state.scenario.description}
Required steps for the virtual assistant to complete: ${state.scenario.required_steps.join(", ")}

INSTRUCTIONS:
- Respond authentically as this person would in a real STR situation
- Maintain consistent personality and emotional progression
- NEVER mention this is a training exercise or break character
- NEVER provide feedback or scoring during the session
- Escalate the situation appropriately if the VA makes critical errors
- Gradually reveal information to create a natural conversation flow
- Reference your hidden motivations subtly in your communication
  `;
  
  try {
    const messages = [
      { role: "system", content: prompt },
      ...state.messages.map(m => ({
        role: m._getType() === "human" ? "user" : "model", 
        content: m.content
      }))
    ];
    
    const response = await llm.invoke(messages);
    const text = asText(response);
    
    return {
      messages: [new AIMessage(text)],
      current_emotion: newEmotion,
      turn_count: state.turn_count + 1,
      next: "scoring_agent"
    };
  } catch (error) {
    console.error("Guest simulation failed:", error);
    return {
      messages: [new AIMessage("I'm having trouble with this request. Could you try again?")],
      next: "scoring_agent"
    };
  }
}
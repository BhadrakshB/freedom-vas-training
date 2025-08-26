import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Define all scoring dimensions from PRD
export type ScoringDimension = 
  | "policy_adherence"
  | "empathy_index"
  | "completeness"
  | "escalation_judgment"
  | "time_efficiency";

// State object that persists through the entire training session
export const TrainingState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, update) => [...prev, ...update],
    default: () => []
  }),
  // Scenario data
  scenario: Annotation<{
    id: string;
    title: string;
    description: string;
    required_steps: string[];
    critical_errors: string[];
    time_pressure: number;
  }>,
  // Persona data
  persona: Annotation<{
    name: string;
    background: string;
    personality_traits: string[];
    hidden_motivations: string[];
    communication_style: string;
    emotional_arc: string[];
  }>,
  // Hidden scoring metrics (never visible during session)
  scores: Annotation<Record<ScoringDimension, number | null>>,
  missing_steps: Annotation<string[]>({
    reducer: (prev, update) => update, // Replace rather than accumulate
    default: () => []
  }),
  escalation_points: Annotation<string[]>({
    reducer: (prev, update) => update, // Replace rather than accumulate
    default: () => []
  }),
  current_emotion: Annotation<string>,
  turn_count: Annotation<number>,
  max_turns: Annotation<number>,
  verdict_ready: Annotation<boolean>,
  // Session metadata
  sessionId: Annotation<string>,
  startTime: Annotation<Date>,
  trainingObjective: Annotation<string>,
  difficultyLevel: Annotation<"Beginner" | "Intermediate" | "Advanced">,
  // Control flow
  next: Annotation<"scenario_creator" | "persona_generator" | "guest_simulator" | "scoring_agent" | "feedback_generator" | "done">,
});
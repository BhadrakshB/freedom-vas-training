import { TrainingState } from "../training-state";
import { HumanMessage } from "@langchain/core/messages";

// Helper to normalize text
function normalizeText(text: any): string {
  if (typeof text === "string") return text.toLowerCase();
  if (Array.isArray(text)) return text.map(t => normalizeText(t)).join(" ");
  if (typeof text === "object" && text?.text) return normalizeText(text.text);
  return "";
}

export async function scoringAgent(state: typeof TrainingState.State) {
  // Get the latest VA response
  const latestResponse = state.messages[state.messages.length - 1];
  const responseText = normalizeText(latestResponse.content);
  
  // Initialize scores if not present
  const scores = state.scores || {
    policy_adherence: null,
    empathy_index: null,
    completeness: null,
    escalation_judgment: null,
    time_efficiency: null
  };
  
  // Update missing steps
  const completedSteps = state.scenario.required_steps.filter(step => 
    responseText.includes(normalizeText(step))
  );
  const missingSteps = state.scenario.required_steps.filter(
    step => !completedSteps.includes(step)
  );
  
  // Check for critical errors
  const criticalErrors = state.scenario.critical_errors.filter(error => 
    responseText.includes(normalizeText(error))
  );
  
  // Calculate time efficiency
  const timeElapsed = (new Date().getTime() - state.startTime.getTime()) / 60000; // minutes
  const timeEfficiency = Math.min(1, state.scenario.time_pressure / timeElapsed);
  
  // Update scores
  const newScores = {
    ...scores,
    policy_adherence: criticalErrors.length > 0 ? 0 : (scores.policy_adherence || 0.5),
    completeness: 1 - (missingSteps.length / state.scenario.required_steps.length),
    time_efficiency: timeEfficiency
  };
  
  // Determine if verdict is ready
  const verdictReady = (
    missingSteps.length === 0 ||  // All required steps completed
    state.turn_count >= state.max_turns ||  // Max turns reached
    criticalErrors.length > 0  // Critical error detected
  );
  
  return {
    scores: newScores,
    missing_steps: missingSteps,
    escalation_points: criticalErrors,
    verdict_ready: verdictReady,
    next: verdictReady ? "feedback_generator" : "guest_simulator"
  };
}
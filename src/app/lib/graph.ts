import { StateGraph } from "@langchain/langgraph";
import { TrainingState } from "./training-state";
import { scenarioCreator } from "./agents/scenario-creator";
import { personaGenerator } from "./agents/persona-generator";
import { guestSimulator } from "./agents/guest-simulator";
import { scoringAgent } from "./agents/silent-scoring";
import { feedbackGenerator } from "./agents/feedback-generator";

export function createTrainingWorkflow() {
  const workflow = new StateGraph(TrainingState)
    .addNode("scenario_creator", scenarioCreator)
    .addNode("persona_generator", personaGenerator)
    .addNode("guest_simulator", guestSimulator)
    .addNode("scoring_agent", scoringAgent)
    .addNode("feedback_generator", feedbackGenerator)
    .addEdge("scenario_creator", "persona_generator")
    .addEdge("persona_generator", "guest_simulator")
    .addEdge("guest_simulator", "scoring_agent")
    .addConditionalEdges("scoring_agent", (state) => state.next, {
      guest_simulator: "guest_simulator",
      feedback_generator: "feedback_generator"
    })
    .addEdge("feedback_generator", "__end__")
    .setEntryPoint("scenario_creator");

  return workflow.compile();
}

export function initializeState(
  trainingObjective: string,
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced",
  sessionId: string = `session-${Date.now()}`
) {
  return {
    messages: [],
    scenario: {
      id: "",
      title: "",
      description: "",
      required_steps: [],
      critical_errors: [],
      time_pressure: 0
    },
    persona: {
      name: "",
      background: "",
      personality_traits: [],
      hidden_motivations: [],
      communication_style: "",
      emotional_arc: []
    },
    scores: {
      policy_adherence: null,
      empathy_index: null,
      completeness: null,
      escalation_judgment: null,
      time_efficiency: null
    },
    missing_steps: [],
    escalation_points: [],
    current_emotion: "",
    turn_count: 0,
    max_turns: 10,
    verdict_ready: false,
    sessionId,
    startTime: new Date(),
    trainingObjective,
    difficultyLevel,
    next: "scenario_creator" as string
  };
}
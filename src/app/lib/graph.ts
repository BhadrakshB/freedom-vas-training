// src/lib/graph.ts
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  Annotation,
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/** LLM (Gemini) */
const llm = new ChatGoogleGenerativeAI({
  // pick your model; flash is fast, pro is stronger
  model: "gemini-1.5-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
  // temperature: 0.2,
});

/** ----- State definition (typed, simple) ----- */
// We extend MessagesAnnotation to keep chat history safely with the built-in reducer.
export const OrchestratorState = Annotation.Root({
  ...MessagesAnnotation.spec, // adds: messages: BaseMessage[] with messagesStateReducer
  task: Annotation<string>,
  next: Annotation<"researcher" | "coder" | "done">,
  facts: Annotation<string[]>({
    default: () => [],
    reducer: (prev, update) => prev.concat(update),
  }),
});

/** Helper to normalize Gemini output text */
function asText(ai: AIMessage): string {
  if (typeof ai.content === "string") return ai.content;
  // Gemini sometimes returns multi-part content; join text parts
  if (Array.isArray(ai.content)) {
    return ai.content
      .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .join(" ")
      .trim();
  }
  return "";
}

/** ----- Nodes ----- */
async function planner(state: typeof OrchestratorState.State) {
  const res = await llm.invoke([
    new HumanMessage(
      `You are a planner. Task: "${state.task}". 
Plan brief steps, then say either the word "research" or "code" to indicate who should go next.`
    ),
  ]);
  const text = asText(res);
  const next: "researcher" | "coder" =
    /research/i.test(text) ? "researcher" : "coder";
  // Return a PARTIAL state update – MessagesAnnotation reducer appends res
  return { messages: [res], next };
}

async function researcher(state: typeof OrchestratorState.State) {
  const res = await llm.invoke([
    new HumanMessage(
      `You are a researcher. Extract 3-5 crisp facts to help with: "${state.task}".`
    ),
  ]);
  const text = asText(res);
  return { messages: [res], facts: [text] };
}

async function coder(state: typeof OrchestratorState.State) {
  const facts = state.facts.length ? `Facts:\n${state.facts.join("\n")}` : "";
  const res = await llm.invoke([
    new HumanMessage(
      `You are a coding assistant. Write high-level pseudocode for: "${state.task}". ${facts}`
    ),
  ]);
  return { messages: [res], next: "done" };
}

/** ----- Graph ----- */
const builder = new StateGraph(OrchestratorState)
  .addNode("planner", planner)
  .addNode("researcher", researcher)
  .addNode("coder", coder)
  .addEdge(START, "planner")
  // Route after planner depending on state.next
  .addConditionalEdges("planner", (s) => s.next ?? "coder", {
    researcher: "researcher",
    coder: "coder",
    done: END,
  })
  // After research we always go to coder
  .addEdge("researcher", "coder")
  // coder ends the flow
  .addEdge("coder", END);

export const app = builder.compile();

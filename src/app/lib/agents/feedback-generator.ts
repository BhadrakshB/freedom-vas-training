import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage } from "@langchain/core/messages";
import { TrainingState } from "../training-state";

// Helper to format conversation history
function formatConversation(messages: { _getType(): string; content: unknown }[]): string {
  return messages
    .map(m => {
      const role = m._getType() === "ai" ? "Guest" : "VA";
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `${role}: ${content}`;
    })
    .join("\n");
}

export async function feedbackGenerator(state: typeof TrainingState.State) {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-pro",
    apiKey: process.env.GOOGLE_API_KEY!,
    temperature: 0.3, // More precise for feedback
  });
  
  // Retrieve relevant SOPs based on missing steps
  // const retriever = await getRetriever();
  // const relevantDocs = await retriever.invoke(
  //   `SOPs related to: ${state.missing_steps.join(", ")}`
  // );
  
  // Format SOP references
  // const sopReferences = relevantDocs.map(doc => 
  //   `Document: ${doc.pageContent}\nSource: ${doc.metadata.source}`
  // ).join("\n\n");
  const sopReferences = "No relevant SOPs found.";
  
  const prompt = `
You are a training evaluator for STR virtual assistants.
Analyze this training session and provide detailed feedback:

Conversation Summary:
${formatConversation(state.messages)}

Performance Scores:
Policy Adherence: ${state.scores.policy_adherence?.toFixed(2) || 'N/A'}
Empathy Index: ${state.scores.empathy_index?.toFixed(2) || 'N/A'}
Completeness: ${state.scores.completeness?.toFixed(2) || 'N/A'}
Escalation Judgment: ${state.scores.escalation_judgment?.toFixed(2) || 'N/A'}
Time Efficiency: ${state.scores.time_efficiency?.toFixed(2) || 'N/A'}

Missing Steps:
${state.missing_steps.join("\n")}

Critical Errors:
${state.escalation_points.join("\n")}

Relevant SOP References:
${sopReferences}

Provide feedback with these sections:
1. Overall Performance Summary (1-2 sentences)
2. Strengths Observed
3. Areas for Improvement (with specific examples from conversation)
4. Actionable Recommendations
5. Resources for Further Learning

Keep feedback constructive, specific, and grounded in company policies.
  `;
  
  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    
    return {
      messages: [new AIMessage(text)],
      next: "done"
    };
  } catch (error) {
    console.error("Feedback generation failed:", error);
    return {
      messages: [new AIMessage("Error generating feedback. Please try the session again.")],
      next: "done"
    };
  }
}
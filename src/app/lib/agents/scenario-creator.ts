import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TrainingState } from "../training-state";

export async function scenarioCreator(state: typeof TrainingState.State) {
  const llm = new ChatGoogleGenerativeAI({
    // pick your model; flash is fast, pro is stronger
    model: "gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY!,
    // temperature: 0.2,
});

  
  // Retrieve relevant SOPs
  // const retriever = await getRetriever();
  // const relevantDocs = await retriever.invoke(
  //   `Scenario templates for: ${state.trainingObjective}`
  // );
  
  // Format documents for context
  // const context = relevantDocs.map(doc => 
  //   `Document: ${doc.pageContent}\nSource: ${doc.metadata.source}`
  // ).join("\n\n");

  const context = ""
  
  const prompt = `
You are a training scenario designer for STR virtual assistants.
Create a realistic scenario based on the training objective: "${state.trainingObjective}"
Difficulty Level: ${state.difficultyLevel}

Use these SOP references:
${context}

CRITICAL: Output MUST be valid JSON with these exact fields:
- title: Short descriptive name
- description: Detailed narrative setting up the scenario
- required_steps: Array of mandatory steps the VA must complete
- critical_errors: Array of critical mistakes that end session immediately
- time_pressure: Number of minutes for completion

Example output format:
{
  "title": "Last-Minute Booking Request",
  "description": "Guest needs accommodation tonight after missing flight...",
  "required_steps": ["Verify identity", "Confirm availability", ...],
  "critical_errors": ["Promising specific features without verification", ...],
  "time_pressure": 15
}
  `;
  
  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    
    // Attempt to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const scenario = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      title: "Fallback Scenario",
      description: "Generic scenario description",
      required_steps: ["Respond accurately"],
      critical_errors: [],
      time_pressure: 10
    };
    
    return {
      scenario: {
        id: `scenario-${Date.now()}`,
        ...scenario,
        required_steps: scenario.required_steps || [],
        critical_errors: scenario.critical_errors || []
      },
      next: "persona_generator"
    };
  } catch (error) {
    console.error("Scenario creation failed:", error);
    return {
      scenario: {
        id: "fallback-scenario",
        title: "Basic Inquiry",
        description: "Guest has a simple question about check-in",
        required_steps: ["Answer question accurately"],
        critical_errors: [],
        time_pressure: 10
      },
      next: "persona_generator"
    };
  }
}
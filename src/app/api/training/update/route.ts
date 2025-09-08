import { NextRequest } from "next/server";
import { workflow } from "@/app/lib/agents/v2/graph_v2";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get persona, scenario, and messages
    const body = await request.json();
    const { persona, scenario, messages } = body;

    // Validate required fields
    if (!persona || !scenario || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ 
          message: "Bad Request", 
          error: "persona, scenario, and messages array are required" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Invoke workflow with the provided data
    const data = await workflow.invoke({
      persona,
      scenario,
      conversationHistory: messages,
    });

    // console.log("=== WORKFLOW UPDATE STATE RETURNED ===");
    // console.log("Full State:", JSON.stringify(data, null, 2));
    // console.log("Messages:", data?.messages?.length || 0);
    // console.log("Scenario:", data?.scenario ? "Present" : "Not present");
    // console.log("Persona:", data?.persona ? "Present" : "Not present");
    // console.log("=======================================");

    const updatedMessages = data?.conversationHistory || [];
    console.log(`UPDATED MESSAGES: ${updatedMessages}`);
    
console.log("=== UPDATED MESSAGES ===");
    updatedMessages.forEach((message, index) => {
      console.log(`Message ${index + 1}:`);
      console.log(`  Role: ${message.name || 'N/A'}`);
      console.log(`  Content: ${message.content || 'N/A'}`);
      console.log('---');
    });
    console.log("========================");
    

    const lastMessage =
      updatedMessages[updatedMessages.length - 1]?.content || "Workflow updated.";

      console.log(`FINAL MESSAGE: ${lastMessage}`);

    return new Response(
      JSON.stringify({
        message: "Training session updated successfully.",
        state: data,
        scenario: data?.scenario,
        persona: data?.persona,
        messages: data?.conversationHistory,
        finalOutput: lastMessage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in updateWorkflow API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(
      JSON.stringify({ message: "Internal Server Error", error: errorMessage }),
      { status: 500 }
    );
  }
}

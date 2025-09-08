import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { workflow } from "@/app/lib/agents/v2/graph_v2";

export async function POST(request: NextRequest) {
  try {

    const data = await workflow.invoke({
      conversationHistory: [],
    });

    console.log("=== WORKFLOW STATE RETURNED ===");
    console.log("Full State:", JSON.stringify(data, null, 2));
    console.log("Messages:", data?.conversationHistory?.length || 0);
    console.log("Scenario:", data?.scenario ? "Present" : "Not present");
    console.log("Persona:", data?.persona ? "Present" : "Not present");
    console.log("===============================");

    const messages = data?.conversationHistory || [];
    const lastMessage =
      messages[messages.length - 1]?.content || "Workflow completed.";

    return new Response(
      JSON.stringify({
        message: "Training session started successfully.",
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
    console.error("Error in startWorkflow API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(
      JSON.stringify({ message: "Internal Server Error", error: errorMessage }),
      { status: 500 }
    );
  }
}

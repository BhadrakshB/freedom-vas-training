// src/app/api/agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { app } from "../../lib/graph";

// Force Node runtime (Edge lacks some Node APIs certain providers use)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const { input, threadId } = await req.json();

        if (!input || typeof input !== "string") {
            return NextResponse.json({ error: "Provide 'input' string" }, { status: 400 });
        }

        // Kick off a run; we seed both the chat history & our 'task' field
        const result = await app.invoke({
            messages: [new HumanMessage(input)],
            task: input,
        });

        const last = result.messages[result.messages.length - 1];
        return NextResponse.json({
            output: typeof last.content === "string" ? last.content : last,
            facts: result.facts ?? [],
            next: result.next ?? "done",
        });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
    }
}

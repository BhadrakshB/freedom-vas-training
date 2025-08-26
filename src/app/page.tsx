"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResp(null);
    const r = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ input }),
      headers: { "Content-Type": "application/json" },
    });
    const j = await r.json();
    setResp(j);
    setLoading(false);
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">LangGraph × Gemini Orchestrator</h1>
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Describe a task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={run}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Run"}
        </button>
      </div>

      {resp && (
        <div className="rounded border p-4 space-y-2">
          <div className="text-sm text-gray-500">next: {resp.next}</div>
          <pre className="whitespace-pre-wrap">{String(resp.output ?? "")}</pre>
          {resp.facts?.length ? (
            <div>
              <div className="font-medium mt-2">Facts</div>
              <ul className="list-disc ml-5">
                {resp.facts.map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}

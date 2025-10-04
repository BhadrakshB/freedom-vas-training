"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { CollapsiblePanel } from "./CollapsiblePanel";
import type { ScenarioGeneratorSchema } from "../lib/agents/v2/graph_v2";

interface CustomScenarioPanelProps {
  value: string | ScenarioGeneratorSchema | null;
  onChange: (value: string) => void;
  onRefine: () => void;
  isRefining: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
}

function formatScenarioSchema(schema: ScenarioGeneratorSchema): string {
  return `Title: ${schema.scenario_title}

Business Context:
${schema.business_context}

Guest Situation:
${schema.guest_situation}

Constraints & Policies:
${schema.constraints_and_policies
  .map((item, i) => `${i + 1}. ${item}`)
  .join("\n")}

Expected VA Challenges:
${schema.expected_va_challenges
  .map((item, i) => `${i + 1}. ${item}`)
  .join("\n")}

Difficulty Level: ${schema.difficulty_level}

Success Criteria:
${schema.success_criteria.map((item, i) => `${i + 1}. ${item}`).join("\n")}`;
}

export function CustomScenarioPanel({
  value,
  onChange,
  onRefine,
  isRefining,
  disabled = false,
  defaultOpen = false,
}: CustomScenarioPanelProps) {
  // Convert schema object to formatted string for display
  const displayValue =
    value && typeof value === "object"
      ? formatScenarioSchema(value)
      : value || "";

  const hasValue = value && (typeof value === "string" ? value.trim() : true);

  return (
    <CollapsiblePanel
      title="Custom Scenario"
      defaultOpen={defaultOpen}
      ctaText="Click to customize your training scenario"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefine}
            disabled={disabled || isRefining || !hasValue}
            className="h-7 px-2 text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {isRefining ? "Refining..." : "Refine"}
          </Button>
        </div>

        <Textarea
          placeholder="e.g., Guest complaining about noise from neighboring unit..."
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-24 text-sm resize-none"
          disabled={disabled || isRefining}
        />

        <p className="text-xs text-muted-foreground">
          Leave blank for AI-generated scenario or use the refine button to
          enhance your input
        </p>
      </div>
    </CollapsiblePanel>
  );
}

"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { CollapsiblePanel } from "./CollapsiblePanel";
import type { PersonaGeneratorSchema } from "../lib/agents/v2/graph_v2";

interface CustomPersonaPanelProps {
  value: string | PersonaGeneratorSchema | null;
  onChange: (value: string) => void;
  onRefine: () => void;
  isRefining: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
}

function formatPersonaSchema(schema: PersonaGeneratorSchema): string {
  return `Name: ${schema.name}

Demographics:
${schema.demographics}

Personality Traits:
${schema.personality_traits.map((trait, i) => `${i + 1}. ${trait}`).join("\n")}

Communication Style:
${schema.communication_style}

Emotional Tone:
${schema.emotional_tone}

Expectations:
${schema.expectations.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Escalation Behavior:
${schema.escalation_behavior.map((item, i) => `${i + 1}. ${item}`).join("\n")}`;
}

export function CustomPersonaPanel({
  value,
  onChange,
  onRefine,
  isRefining,
  disabled = false,
  defaultOpen = false,
}: CustomPersonaPanelProps) {
  // Convert schema object to formatted string for display
  const displayValue =
    value && typeof value === "object"
      ? formatPersonaSchema(value)
      : value || "";

  const hasValue = value && (typeof value === "string" ? value.trim() : true);

  return (
    <CollapsiblePanel
      title="Custom Guest Persona"
      defaultOpen={defaultOpen}
      ctaText="Click to customize your guest persona"
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
          placeholder="e.g., Frustrated business traveler, first-time Airbnb user..."
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-20 text-sm resize-none"
          disabled={disabled || isRefining}
        />

        <p className="text-xs text-muted-foreground">
          Leave blank for AI-generated persona or use the refine button to
          enhance your input
        </p>
      </div>
    </CollapsiblePanel>
  );
}

"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { CollapsiblePanel } from "./CollapsiblePanel";

interface CustomScenarioPanelProps {
  value: string;
  onChange: (value: string) => void;
  onRefine: () => void;
  isRefining: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
}

export function CustomScenarioPanel({
  value,
  onChange,
  onRefine,
  isRefining,
  disabled = false,
  defaultOpen = false,
}: CustomScenarioPanelProps) {
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
            disabled={disabled || isRefining || !value.trim()}
            className="h-7 px-2 text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {isRefining ? "Refining..." : "Refine"}
          </Button>
        </div>
        
        <Textarea
          placeholder="e.g., Guest complaining about noise from neighboring unit..."
          value={value}
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
"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { CollapsiblePanel } from "./CollapsiblePanel";

interface CustomPersonaPanelProps {
  value: string;
  onChange: (value: string) => void;
  onRefine: () => void;
  isRefining: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
}

export function CustomPersonaPanel({
  value,
  onChange,
  onRefine,
  isRefining,
  disabled = false,
  defaultOpen = false,
}: CustomPersonaPanelProps) {
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
            disabled={disabled || isRefining || !value.trim()}
            className="h-7 px-2 text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {isRefining ? "Refining..." : "Refine"}
          </Button>
        </div>
        
        <Textarea
          placeholder="e.g., Frustrated business traveler, first-time Airbnb user..."
          value={value}
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
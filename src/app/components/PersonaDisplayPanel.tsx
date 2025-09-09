"use client";

import React from "react";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { PersonaGeneratorSchema } from "@/app/lib/agents/v2/graph_v2";

interface PersonaDisplayPanelProps {
  persona: PersonaGeneratorSchema;
  defaultOpen?: boolean;
}

export function PersonaDisplayPanel({
  persona,
  defaultOpen = false,
}: PersonaDisplayPanelProps) {
  return (
    <CollapsiblePanel
      title="Guest Persona"
      defaultOpen={defaultOpen}
      ctaText="View current guest persona details"
    >
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Name
          </h4>
          <p className="text-sm">{persona.name}</p>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Demographics
          </h4>
          <p className="text-sm">{persona.demographics}</p>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Emotional Tone
          </h4>
          <p className="text-sm">{persona.emotional_tone}</p>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Communication Style
          </h4>
          <p className="text-sm">{persona.communication_style}</p>
        </div>
        
        {persona.personality_traits && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              Personality Traits
            </h4>
            <p className="text-sm">{persona.personality_traits}</p>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}
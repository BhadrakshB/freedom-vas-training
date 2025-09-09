"use client";

import React from "react";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { ScenarioGeneratorSchema } from "@/app/lib/agents/v2/graph_v2";

interface ScenarioDisplayPanelProps {
  scenario: ScenarioGeneratorSchema;
  defaultOpen?: boolean;
}

export function ScenarioDisplayPanel({
  scenario,
  defaultOpen = false,
}: ScenarioDisplayPanelProps) {
  return (
    <CollapsiblePanel
      title="Training Scenario"
      defaultOpen={defaultOpen}
      ctaText="View current training scenario details"
    >
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Title
          </h4>
          <p className="text-sm">{scenario.scenario_title}</p>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Situation
          </h4>
          <p className="text-sm">{scenario.guest_situation}</p>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1">
            Difficulty
          </h4>
          <p className="text-sm">{scenario.difficulty_level}</p>
        </div>
        
        {scenario.business_context && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              Context
            </h4>
            <p className="text-sm">{scenario.business_context}</p>
          </div>
        )}
        
        {scenario.expected_va_challenges && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              Expected Challenges
            </h4>
            <p className="text-sm">{scenario.expected_va_challenges}</p>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}
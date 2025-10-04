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
        
        {scenario.constraints_and_policies && scenario.constraints_and_policies.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              Policies & Constraints
            </h4>
            <p className="text-sm">{scenario.constraints_and_policies.join(', ')}</p>
          </div>
        )}
        
        {scenario.expected_va_challenges && scenario.expected_va_challenges.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              Expected Challenges
            </h4>
            <p className="text-sm">{scenario.expected_va_challenges.join(', ')}</p>
          </div>
        )}
        
        {scenario.success_criteria && scenario.success_criteria.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">
              Success Criteria
            </h4>
            <p className="text-sm">{scenario.success_criteria.join(', ')}</p>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  );
}
"use client";

import React from "react";
import {
  CustomScenarioPanel,
  CustomPersonaPanel,
  ScenarioDisplayPanel,
  PersonaDisplayPanel,
  FeedbackDisplayPanel,
} from "./";
import type {
  ScenarioGeneratorSchema,
  PersonaGeneratorSchema,
} from "../lib/agents/v2/graph_v2";

interface TrainingPanelsProps {
  trainingStarted: boolean;
  isSessionCompleted: boolean;
  sessionFeedback: any;
  scenario: ScenarioGeneratorSchema | null;
  persona: PersonaGeneratorSchema | null;
  customScenario: string;
  customPersona: string;
  isRefiningScenario: boolean;
  isRefiningPersona: boolean;
  isLoading: boolean;
  onCustomScenarioChange: (value: string) => void;
  onCustomPersonaChange: (value: string) => void;
  onRefineScenario: () => void;
  onRefinePersona: () => void;
  onStartNewSession: () => void;
}

export function TrainingPanels({
  trainingStarted,
  isSessionCompleted,
  sessionFeedback,
  scenario,
  persona,
  customScenario,
  customPersona,
  isRefiningScenario,
  isRefiningPersona,
  isLoading,
  onCustomScenarioChange,
  onCustomPersonaChange,
  onRefineScenario,
  onRefinePersona,
  onStartNewSession,
}: TrainingPanelsProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
      {!trainingStarted ? (
        <>
          {/* Custom Scenario Input Panel */}
          <CustomScenarioPanel
            value={customScenario}
            onChange={onCustomScenarioChange}
            onRefine={onRefineScenario}
            isRefining={isRefiningScenario}
            disabled={isLoading}
            defaultOpen={false}
          />

          {/* Custom Persona Input Panel */}
          <CustomPersonaPanel
            value={customPersona}
            onChange={onCustomPersonaChange}
            onRefine={onRefinePersona}
            isRefining={isRefiningPersona}
            disabled={isLoading}
            defaultOpen={false}
          />
        </>
      ) : (
        <>
          {/* Feedback Display Panel - shown when session is completed */}
          {isSessionCompleted && sessionFeedback && (
            <FeedbackDisplayPanel
              feedback={sessionFeedback}
              onStartNewSession={onStartNewSession}
              defaultOpen={true}
            />
          )}
          {/* Generated Scenario Display Panel */}
          {scenario && (
            <ScenarioDisplayPanel scenario={scenario} defaultOpen={true} />
          )}

          {/* Generated Persona Display Panel */}
          {persona && (
            <PersonaDisplayPanel persona={persona} defaultOpen={true} />
          )}
        </>
      )}
    </div>
  );
}

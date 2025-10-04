"use client";

import React, { useMemo } from "react";
import {
  CustomScenarioPanel,
  CustomPersonaPanel,
  ScenarioDisplayPanel,
  PersonaDisplayPanel,
  FeedbackDisplayPanel,
} from "./";
import { useCoreAppData } from "../contexts/CoreAppDataContext";
import type {
  ScenarioGeneratorSchema,
  PersonaGeneratorSchema,
  FeedbackSchema,
} from "../lib/agents/v2/graph_v2";

export function TrainingPanels() {
  const {
    state,
    setCustomScenario,
    setCustomPersona,
    handleRefineScenario,
    handleRefinePersona,
  } = useCoreAppData();

  // Get the active thread data
  const activeThread = useMemo(() => {
    if (!state.activeThreadId) return null;
    return state.userThreads.find((t) => t.thread.id === state.activeThreadId);
  }, [state.activeThreadId, state.userThreads]);

  // Determine if we have an active thread
  const hasActiveThread = activeThread !== null;

  // Determine training state
  const isSessionCompleted = activeThread?.thread.status === "completed";
  const sessionFeedback = activeThread
    ? (activeThread.thread.feedback as FeedbackSchema) || null
    : null;

  // Use thread's scenario/persona if available, otherwise use context state
  const scenario =
    hasActiveThread && activeThread
      ? (activeThread.thread.scenario as ScenarioGeneratorSchema)
      : (state.scenario as ScenarioGeneratorSchema) ?? null;

  const persona =
    hasActiveThread && activeThread
      ? (activeThread.thread.persona as PersonaGeneratorSchema)
      : (state.persona as PersonaGeneratorSchema) ?? null;

  const customScenario = state.customScenario;
  const customPersona = state.customPersona;
  const isRefiningScenario = state.isRefiningScenario;
  const isRefiningPersona = state.isRefiningPersona;
  const isLoading = state.isLoading;

  // Handler functions
  const handleCustomScenarioChange = (value: string) => {
    setCustomScenario(value);
  };

  const handleCustomPersonaChange = (value: string) => {
    setCustomPersona(value);
  };

  const handleRefineScenarioClick = async () => {
    if (customScenario) {
      const scenarioText =
        typeof customScenario === "string"
          ? customScenario
          : JSON.stringify(customScenario);
      await handleRefineScenario(scenarioText);
    }
  };

  const handleRefinePersonaClick = async () => {
    if (customPersona) {
      const personaText =
        typeof customPersona === "string"
          ? customPersona
          : JSON.stringify(customPersona);
      await handleRefinePersona(personaText);
    }
  };

  const handleStartNewSession = () => {
    // Reset to initial state for new session
    setCustomScenario(null);
    setCustomPersona(null);
  };
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
      {!hasActiveThread ? (
        <>
          {/* Show custom scenario/persona inputs only when no thread is selected */}
          <CustomScenarioPanel
            value={customScenario}
            onChange={handleCustomScenarioChange}
            onRefine={handleRefineScenarioClick}
            isRefining={isRefiningScenario}
            disabled={isLoading}
            defaultOpen={false}
          />

          <CustomPersonaPanel
            value={customPersona}
            onChange={handleCustomPersonaChange}
            onRefine={handleRefinePersonaClick}
            isRefining={isRefiningPersona}
            disabled={isLoading}
            defaultOpen={false}
          />

          {/* Show generated scenario/persona if available in context */}
          {scenario && (
            <ScenarioDisplayPanel scenario={scenario} defaultOpen={true} />
          )}

          {persona && (
            <PersonaDisplayPanel persona={persona} defaultOpen={true} />
          )}
        </>
      ) : (
        <>
          {/* Show active thread's scenario and persona */}
          {isSessionCompleted && sessionFeedback && (
            <FeedbackDisplayPanel
              feedback={sessionFeedback}
              onStartNewSession={handleStartNewSession}
              defaultOpen={true}
            />
          )}

          {scenario && (
            <ScenarioDisplayPanel scenario={scenario} defaultOpen={true} />
          )}

          {persona && (
            <PersonaDisplayPanel persona={persona} defaultOpen={true} />
          )}
        </>
      )}
    </div>
  );
}

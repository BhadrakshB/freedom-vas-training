"use client";

import React, { useMemo } from "react";
import {
  CustomScenarioPanel,
  CustomPersonaPanel,
  ScenarioDisplayPanel,
  PersonaDisplayPanel,
  FeedbackDisplayPanel,
} from "./";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useCoreAppData } from "../contexts/CoreAppDataContext";
import type {
  ScenarioGeneratorSchema,
  PersonaGeneratorSchema,
  FeedbackSchema,
} from "../lib/agents/v2/graph_v2";

interface GroupFeedback {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  scores: {
    communication: number;
    empathy: number;
    accuracy: number;
    overall: number;
  };
  guest_prioritization: {
    analysis: string;
    behavior_pattern: string;
    suggestions: string[];
    score: number;
  };
  responsiveness: {
    analysis: string;
    avg_response_time_sec: number;
    variability: string;
    suggestions: string[];
    score: number;
  };
  session_breakdown: Array<{
    thread_title: string;
    key_observations: string[];
    score: number;
    response_time_sec?: number;
    prioritization_note?: string;
  }>;
}

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
  // Get group feedback if thread is part of a group
  const threadGroup = useMemo(() => {
    if (!activeThread?.thread.groupId) return null;
    return state.threadGroups.find(
      (g) => g.threadGroup.id === activeThread.thread.groupId
    );
  }, [activeThread, state.threadGroups]);

  const groupFeedback = threadGroup?.threadGroup.groupFeedback as
    | GroupFeedback
    | undefined;

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
          {/* Tabbed interface for active thread */}
          <Tabs defaultValue="scenario" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="scenario">Scenario</TabsTrigger>
              <TabsTrigger value="persona">Persona</TabsTrigger>
              <TabsTrigger
                value="tips"
                disabled={!isSessionCompleted}
                className="disabled:opacity-50"
              >
                Tips
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scenario" className="mt-4">
              {scenario && (
                <ScenarioDisplayPanel scenario={scenario} defaultOpen={true} />
              )}
            </TabsContent>

            <TabsContent value="persona" className="mt-4">
              {persona && (
                <PersonaDisplayPanel persona={persona} defaultOpen={true} />
              )}
            </TabsContent>

            <TabsContent value="tips" className="mt-4 space-y-4">
              {isSessionCompleted && sessionFeedback && (
                <FeedbackDisplayPanel
                  feedback={sessionFeedback}
                  onStartNewSession={handleStartNewSession}
                  defaultOpen={true}
                />
              )}

              {groupFeedback && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                  <h3 className="font-semibold text-sm">Group Feedback</h3>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Summary
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {groupFeedback.summary}
                      </p>
                    </div>

                    {groupFeedback.scores && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">
                          Performance Scores
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>Communication:</span>
                            <span className="font-medium">
                              {groupFeedback.scores.communication}/10
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Empathy:</span>
                            <span className="font-medium">
                              {groupFeedback.scores.empathy}/10
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Accuracy:</span>
                            <span className="font-medium">
                              {groupFeedback.scores.accuracy}/10
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overall:</span>
                            <span className="font-medium">
                              {groupFeedback.scores.overall}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {groupFeedback.guest_prioritization && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">
                          Guest Prioritization (Score:{" "}
                          {groupFeedback.guest_prioritization.score}/10)
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {groupFeedback.guest_prioritization.analysis}
                        </p>
                        <p className="text-sm text-muted-foreground italic mb-2">
                          Pattern:{" "}
                          {groupFeedback.guest_prioritization.behavior_pattern}
                        </p>
                        {groupFeedback.guest_prioritization.suggestions.length >
                          0 && (
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {groupFeedback.guest_prioritization.suggestions.map(
                              (sug, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-purple-600 dark:text-purple-400">
                                    →
                                  </span>
                                  <span>{sug}</span>
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                    )}

                    {groupFeedback.responsiveness && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">
                          Responsiveness (Score:{" "}
                          {groupFeedback.responsiveness.score}/10)
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {groupFeedback.responsiveness.analysis}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Avg Response Time:{" "}
                          {groupFeedback.responsiveness.avg_response_time_sec.toFixed(
                            1
                          )}
                          s
                        </p>
                        <p className="text-sm text-muted-foreground italic mb-2">
                          Variability:{" "}
                          {groupFeedback.responsiveness.variability}
                        </p>
                        {groupFeedback.responsiveness.suggestions.length >
                          0 && (
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {groupFeedback.responsiveness.suggestions.map(
                              (sug, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-cyan-600 dark:text-cyan-400">
                                    →
                                  </span>
                                  <span>{sug}</span>
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                    )}

                    {groupFeedback.strengths &&
                      groupFeedback.strengths.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">
                            Common Strengths
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {groupFeedback.strengths.map(
                              (strength: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-green-600 dark:text-green-400">
                                    •
                                  </span>
                                  <span>{strength}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {groupFeedback.weaknesses &&
                      groupFeedback.weaknesses.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">
                            Common Weaknesses
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {groupFeedback.weaknesses.map(
                              (weakness: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-amber-600 dark:text-amber-400">
                                    •
                                  </span>
                                  <span>{weakness}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {groupFeedback.recommendations &&
                      groupFeedback.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">
                            Recommendations
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {groupFeedback.recommendations.map(
                              (rec: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-blue-600 dark:text-blue-400">
                                    •
                                  </span>
                                  <span>{rec}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {groupFeedback.session_breakdown &&
                      groupFeedback.session_breakdown.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">
                            Session Breakdown
                          </h4>
                          <div className="space-y-3">
                            {groupFeedback.session_breakdown.map(
                              (session, idx) => (
                                <div
                                  key={idx}
                                  className="border-l-2 border-muted pl-3 space-y-1"
                                >
                                  <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium">
                                      {session.thread_title}
                                    </p>
                                    <span className="text-xs font-medium">
                                      {session.score}/10
                                    </span>
                                  </div>
                                  {session.response_time_sec !== undefined && (
                                    <p className="text-xs text-muted-foreground">
                                      Response Time:{" "}
                                      {session.response_time_sec.toFixed(1)}s
                                    </p>
                                  )}
                                  {session.prioritization_note && (
                                    <p className="text-xs text-muted-foreground italic">
                                      {session.prioritization_note}
                                    </p>
                                  )}
                                  {session.key_observations.length > 0 && (
                                    <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                                      {session.key_observations.map(
                                        (obs, obsIdx) => (
                                          <li
                                            key={obsIdx}
                                            className="flex items-start gap-1"
                                          >
                                            <span>-</span>
                                            <span>{obs}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LeftSidebar } from "./LeftSidebar";
import { ErrorDisplay } from "./ErrorDisplay";
import { TrainingStartScreen } from "./TrainingStartScreen";
import { TrainingChatArea } from "./TrainingChatArea";
import { TrainingPanels } from "./TrainingPanels";
import { ResizeHandle } from "./ResizeHandle";
import {
  BulkSessionCreation,
  SessionConfiguration,
} from "./BulkSessionCreation";
import { useResizePanel } from "../hooks/useResizePanel";
import { useTrainingHandlers } from "../hooks/useTrainingHandlers";

export function ChatPage() {
  const {
    resizeRef,
    panelWidth,
    isResizing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useResizePanel();

  const {
    // State
    messages,
    isLoading,
    trainingStarted,
    trainingStatus,
    sessionFeedback,
    scenario,
    persona,
    customScenario,
    customPersona,
    isRefiningScenario,
    isRefiningPersona,
    errorMessage,
    errorType,
    currentThreadId,
    isEndingTraining,
    isSessionCompleted,
    isSessionError,
    isTrainingActive,

    // Actions
    setCustomScenario,
    setCustomPersona,
    handleStartTraining,
    handleSendMessage,
    handleEndTraining,
    handleStartNewSession,
    handleThreadSelect,
    handleRetry,
    handleRefineScenario,
    handleRefinePersona,
    handleStartAllSessions,
  } = useTrainingHandlers();

  // Bulk session creation state
  const [showBulkCreation, setShowBulkCreation] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [sessionConfigurations, setSessionConfigurations] = useState<
    SessionConfiguration[]
  >([{ id: "1", title: "Session 1", scenario: "", persona: "" }]);
  const [isCreatingBulkSessions, setIsCreatingBulkSessions] = useState(false);

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Bulk session creation handlers
  const handleSessionCountChange = (count: number) => {
    setSessionCount(count);
    const newConfigurations: SessionConfiguration[] = [];

    for (let i = 1; i <= count; i++) {
      const existingConfig = sessionConfigurations.find(
        (config) => config.id === i.toString()
      );
      newConfigurations.push({
        id: i.toString(),
        title: existingConfig?.title || `Session ${i}`,
        scenario: existingConfig?.scenario || "",
        persona: existingConfig?.persona || "",
      });
    }

    setSessionConfigurations(newConfigurations);
  };

  const handleConfigurationChange = (
    id: string,
    field: keyof SessionConfiguration,
    value: string
  ) => {
    setSessionConfigurations((prev) =>
      prev.map((config) =>
        config.id === id ? { ...config, [field]: value } : config
      )
    );
  };

  const handleRemoveConfiguration = (id: string) => {
    if (sessionConfigurations.length > 1) {
      const newConfigs = sessionConfigurations.filter(
        (config) => config.id !== id
      );
      setSessionConfigurations(newConfigs);
      setSessionCount(newConfigs.length);
    }
  };

  const handleAddConfiguration = () => {
    const newId = (sessionConfigurations.length + 1).toString();
    const newConfig: SessionConfiguration = {
      id: newId,
      title: `Session ${sessionConfigurations.length + 1}`,
      scenario: "",
      persona: "",
    };
    setSessionConfigurations((prev) => [...prev, newConfig]);
    setSessionCount(sessionConfigurations.length + 1);
  };

  const handleBulkSessionStart = async () => {
    setIsCreatingBulkSessions(true);
    try {
      const result = await handleStartAllSessions(sessionConfigurations);
      if (result?.success) {
        // Reset bulk creation state
        setShowBulkCreation(false);
        setSessionCount(1);
        setSessionConfigurations([
          { id: "1", title: "Session 1", scenario: "", persona: "" },
        ]);
      }
    } finally {
      setIsCreatingBulkSessions(false);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar */}
      <LeftSidebar
        onThreadSelect={handleThreadSelect}
        selectedThreadId={currentThreadId}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col bg-background relative ${
          isResizing ? "select-none" : ""
        }`}
      >
        {/* Header Section */}
        <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate pr-2">
            STR Virtual Assistant Training
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
          </div>
        </header>

        {/* Error Display */}
        <ErrorDisplay errorMessage={errorMessage} errorType={errorType} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex">
          {/* Left Side - Chat Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!trainingStarted ? (
              <TrainingStartScreen
                onStartTraining={handleStartTraining}
                onShowBulkCreation={() => setShowBulkCreation(true)}
                isLoading={isLoading}
              />
            ) : (
              <TrainingChatArea
                messages={messages}
                trainingStatus={trainingStatus}
                isTrainingActive={isTrainingActive}
                isSessionCompleted={isSessionCompleted}
                isSessionError={isSessionError}
                isLoading={isLoading}
                isEndingTraining={isEndingTraining}
                onSendMessage={handleSendMessage}
                onEndTraining={handleEndTraining}
                onStartNewSession={handleStartNewSession}
                onRetry={isSessionError ? handleRetry : undefined}
              />
            )}
          </div>

          {/* Bulk Session Creation Modal */}
          <BulkSessionCreation
            show={showBulkCreation}
            sessionCount={sessionCount}
            sessionConfigurations={sessionConfigurations}
            isCreatingBulkSessions={isCreatingBulkSessions}
            onClose={() => setShowBulkCreation(false)}
            onSessionCountChange={handleSessionCountChange}
            onConfigurationChange={handleConfigurationChange}
            onRemoveConfiguration={handleRemoveConfiguration}
            onAddConfiguration={handleAddConfiguration}
            onStartAllSessions={handleBulkSessionStart}
          />

          {/* Resize Handle */}
          <ResizeHandle
            ref={resizeRef}
            onMouseDown={handleMouseDown}
            isResizing={isResizing}
          />

          {/* Right Side - Panels Section */}
          <div
            className="border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col"
            style={{ width: `${panelWidth}px` }}
          >
            <TrainingPanels
              trainingStarted={trainingStarted}
              isSessionCompleted={isSessionCompleted}
              sessionFeedback={sessionFeedback}
              scenario={scenario}
              persona={persona}
              customScenario={customScenario}
              customPersona={customPersona}
              isRefiningScenario={isRefiningScenario}
              isRefiningPersona={isRefiningPersona}
              isLoading={isLoading}
              onCustomScenarioChange={setCustomScenario}
              onCustomPersonaChange={setCustomPersona}
              onRefineScenario={handleRefineScenario}
              onRefinePersona={handleRefinePersona}
              onStartNewSession={handleStartNewSession}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

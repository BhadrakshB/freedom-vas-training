"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LeftSidebar } from "./LeftSidebar";
import { ErrorDisplay } from "./ErrorDisplay";
import { TrainingStartScreen } from "./TrainingStartScreen";
import { TrainingChatArea } from "./TrainingChatArea";
import { ResizeHandle } from "./ResizeHandle";
import { BulkSessionCreation } from "./BulkSessionCreation";
import type { SessionConfiguration } from "./BulkSessionCreation";
import { useResizePanel } from "../hooks/useResizePanel";
import { useCoreAppData } from "../contexts/CoreAppDataContext";
import { TrainingPanels } from "./TrainingPanels";

export function ChatPage() {
  const resizePanel = useResizePanel();

  // Local state for bulk session UI
  const [showBulkCreation, setShowBulkCreation] = useState(false);
  const [sessionConfigurations, setSessionConfigurations] = useState<
    SessionConfiguration[]
  >([
    {
      id: "1",
      title: "Session 1",
      scenario: undefined,
      persona: undefined,
      customScenario: null,
      customPersona: null,
    },
  ]);
  const [groupName, setGroupName] = useState("");

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (resizePanel.isResizing) {
      document.addEventListener("mousemove", resizePanel.handleMouseMove);
      document.addEventListener("mouseup", resizePanel.handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", resizePanel.handleMouseMove);
        document.removeEventListener("mouseup", resizePanel.handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [
    resizePanel.isResizing,
    resizePanel.handleMouseMove,
    resizePanel.handleMouseUp,
  ]);

  const {
    state,
    setActiveThreadId,
    handleStartTraining,
    loadUserThreads,
    setBulkSessionCount,
    updateBulkSessionConfig,
    clearBulkSessionConfig,
    handleStartBulkTraining,
    createNewThreadGroup,
  } = useCoreAppData();

  // Handlers for bulk session UI
  const handleShowBulkCreation = useCallback(() => {
    setShowBulkCreation(true);
    if (!groupName) {
      setGroupName(`Training Group - ${new Date().toLocaleDateString()}`);
    }
  }, [groupName]);

  const handleCloseBulkCreation = useCallback(() => {
    setShowBulkCreation(false);
  }, []);

  const handleSessionCountChange = useCallback(
    (count: number) => {
      const validCount = Math.max(1, Math.min(20, count));
      setBulkSessionCount(validCount);

      const newConfigurations: SessionConfiguration[] = [];
      for (let i = 1; i <= validCount; i++) {
        const existingConfig = sessionConfigurations.find(
          (config) => config.id === i.toString()
        );
        newConfigurations.push(
          existingConfig || {
            id: i.toString(),
            title: `Session ${i}`,
            scenario: undefined,
            persona: undefined,
            customScenario: null,
            customPersona: null,
          }
        );
      }
      setSessionConfigurations(newConfigurations);
    },
    [sessionConfigurations, setBulkSessionCount]
  );

  const handleConfigurationChange = useCallback(
    (id: string, field: keyof SessionConfiguration, value: string) => {
      setSessionConfigurations((prev) =>
        prev.map((config) =>
          config.id === id ? { ...config, [field]: value } : config
        )
      );

      // Update CoreAppDataContext with scenario/persona changes
      const index = parseInt(id) - 1;
      if (field === "customScenario" || field === "customPersona") {
        const config = sessionConfigurations.find((c) => c.id === id);
        updateBulkSessionConfig(index, {
          customScenario:
            field === "customScenario" ? value : config?.customScenario || null,
          customPersona:
            field === "customPersona" ? value : config?.customPersona || null,
        });
      }
    },
    [sessionConfigurations, updateBulkSessionConfig]
  );

  const handleRemoveConfiguration = useCallback(
    (id: string) => {
      setSessionConfigurations((prev) => {
        if (prev.length <= 1) return prev;
        const newConfigs = prev.filter((config) => config.id !== id);
        setBulkSessionCount(newConfigs.length);
        return newConfigs;
      });
    },
    [setBulkSessionCount]
  );

  const handleAddConfiguration = useCallback(() => {
    const newId = (sessionConfigurations.length + 1).toString();
    const newConfig: SessionConfiguration = {
      id: newId,
      title: `Session ${sessionConfigurations.length + 1}`,
      scenario: undefined,
      persona: undefined,
      customScenario: null,
      customPersona: null,
    };
    setSessionConfigurations((prev) => [...prev, newConfig]);
    setBulkSessionCount(sessionConfigurations.length + 1);
  }, [sessionConfigurations.length, setBulkSessionCount]);

  const handleGroupNameChange = useCallback((name: string) => {
    setGroupName(name);
  }, []);

  const handleRefineScenario = useCallback(
    async (sessionId: string, scenario: string) => {
      try {
        const { refineScenario } = await import(
          "../lib/actions/training-actions"
        );
        const result = await refineScenario({ scenario });

        if (result.refinedScenario) {
          // Update the configuration with the refined scenario
          setSessionConfigurations((prev) =>
            prev.map((config) =>
              config.id === sessionId
                ? ({
                    ...config,
                    scenario: result.refinedScenario,
                    customScenario: result.refinedScenario,
                  } as SessionConfiguration)
                : config
            )
          );

          // Also update the context
          const index = parseInt(sessionId) - 1;
          const config = sessionConfigurations.find((c) => c.id === sessionId);
          updateBulkSessionConfig(index, {
            customScenario: result.refinedScenario,
            customPersona: config?.customPersona || null,
          });
        }
      } catch (error) {
        console.error("Error refining scenario:", error);
      }
    },
    [sessionConfigurations, updateBulkSessionConfig]
  );

  const handleRefinePersona = useCallback(
    async (sessionId: string, persona: string) => {
      try {
        const { refinePersona } = await import(
          "../lib/actions/training-actions"
        );
        const result = await refinePersona({ persona });

        if (result.refinedPersona) {
          // Update the configuration with the refined persona
          setSessionConfigurations((prev) =>
            prev.map((config) =>
              config.id === sessionId
                ? ({
                    ...config,
                    persona: result.refinedPersona,
                    customPersona: result.refinedPersona,
                  } as SessionConfiguration)
                : config
            )
          );

          // Also update the context
          const index = parseInt(sessionId) - 1;
          const config = sessionConfigurations.find((c) => c.id === sessionId);
          updateBulkSessionConfig(index, {
            customScenario: config?.customScenario || null,
            customPersona: result.refinedPersona,
          });
        }
      } catch (error) {
        console.error("Error refining persona:", error);
      }
    },
    [sessionConfigurations, updateBulkSessionConfig]
  );

  const handleStartAllSessions = async () => {
    try {
      // Create thread group first if group name is provided
      let groupId: string | null = null;
      if (groupName.trim()) {
        const newGroup = await createNewThreadGroup(groupName.trim());
        groupId = newGroup.id;
      }

      // Sync configurations to CoreAppDataContext
      sessionConfigurations.forEach((config, index) => {
        updateBulkSessionConfig(index, {
          customScenario: config.customScenario || null,
          customPersona: config.customPersona || null,
        });
      });

      // Start bulk training
      await handleStartBulkTraining(groupId!);

      // Reset UI state
      setShowBulkCreation(false);
      setSessionConfigurations([
        {
          id: "1",
          title: "Session 1",
          scenario: undefined,
          persona: undefined,
          customScenario: null,
          customPersona: null,
        },
      ]);
      setGroupName("");
      clearBulkSessionConfig();
    } catch (error) {
      console.error("Error creating bulk sessions:", error);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar */}
      <LeftSidebar
        onThreadSelect={setActiveThreadId}
        selectedThreadId={state.activeThreadGroupId}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col bg-background relative ${
          resizePanel.isResizing ? "select-none" : ""
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
        <ErrorDisplay errorMessage={state.error} errorType={state.errorType} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex">
          {/* Left Side - Chat Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {state.activeThreadId == null ? (
              <TrainingStartScreen
                onStartTraining={handleStartTraining}
                onShowBulkCreation={handleShowBulkCreation}
                isLoading={state.isLoading}
              />
            ) : (
              <TrainingChatArea />
            )}
          </div>

          {/* Resize Handle */}
          <ResizeHandle
            ref={resizePanel.resizeRef}
            onMouseDown={resizePanel.handleMouseDown}
            isResizing={resizePanel.isResizing}
          />

          {/* Right Side - Panels Section */}
          <div
            className="border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col"
            style={{ width: `${resizePanel.panelWidth}px` }}
          >
            <TrainingPanels />
          </div>
        </main>
      </div>

      {/* Bulk Session Creation Modal */}
      <BulkSessionCreation
        show={showBulkCreation}
        sessionCount={sessionConfigurations.length}
        sessionConfigurations={sessionConfigurations}
        groupName={groupName}
        isCreatingBulkSessions={state.isBulkSessionInProgress}
        onClose={handleCloseBulkCreation}
        onSessionCountChange={handleSessionCountChange}
        onConfigurationChange={handleConfigurationChange}
        onRemoveConfiguration={handleRemoveConfiguration}
        onAddConfiguration={handleAddConfiguration}
        onGroupNameChange={handleGroupNameChange}
        onStartAllSessions={handleStartAllSessions}
        onRefineScenario={handleRefineScenario}
        onRefinePersona={handleRefinePersona}
      />
    </div>
  );
}

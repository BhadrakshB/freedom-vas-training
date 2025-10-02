"use client";

import React, { useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LeftSidebar } from "./LeftSidebar";
import { ErrorDisplay } from "./ErrorDisplay";
import { TrainingStartScreen } from "./TrainingStartScreen";
import { TrainingChatArea } from "./TrainingChatArea";
import { ResizeHandle } from "./ResizeHandle";
import { useResizePanel } from "../hooks/useResizePanel";
import { useCoreAppData } from "../contexts/CoreAppDataContext";
import { TrainingPanels } from "./TrainingPanels";

export function ChatPage() {
  const resizePanel = useResizePanel();

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

  const { state, setActiveThreadId, handleStartTraining } = useCoreAppData();

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
                onShowBulkCreation={() => {
                  console.log("Bulk creation not yet implemented");
                }}
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
    </div>
  );
}

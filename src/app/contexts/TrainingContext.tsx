import { BaseMessage } from "@langchain/core/messages";
import { createContext, useState, useMemo } from "react";

export interface TrainingContextState {
  panelWidth: number;
  isResizing: boolean;
}

export interface TrainingActions {
  // UI State Management
  setPanelWidth: (width: number) => void;
  setIsResizing: (resizing: boolean) => void;
}

export interface TrainingContextType
  extends TrainingContextState,
    TrainingActions {}

export const trainingContext = createContext<TrainingContextType>({
  // State
  panelWidth: 320,
  isResizing: false,

  // UI State Management
  setPanelWidth: () => {},
  setIsResizing: () => {},
});

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TrainingContextType = useMemo(
    () => ({
      // State
      panelWidth,
      isResizing,
      // UI State Management
      setPanelWidth,
      setIsResizing,
    }),
    [panelWidth, isResizing]
  );

  return (
    <trainingContext.Provider value={contextValue}>
      {children}
    </trainingContext.Provider>
  );
}

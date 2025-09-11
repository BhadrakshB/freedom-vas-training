import { BaseMessage } from "@langchain/core/messages";
import { createContext, useState } from "react";
import {
  FeedbackSchema,
  PersonaGeneratorSchema,
  ScenarioGeneratorSchema,
  TrainingStateType,
} from "../lib/agents/v2/graph_v2";
import { ErrorType } from "../lib/error-handling";

export interface TrainingState {
  messages: BaseMessage[];
  scenario: ScenarioGeneratorSchema | null;
  persona: PersonaGeneratorSchema | null;
  customScenario: string;
  customPersona: string;
  isRefiningScenario: boolean;
  isRefiningPersona: boolean;
  errorMessage: string | null;
  errorType: ErrorType | null;
  sessionFeedback: FeedbackSchema | null;
  isLoading: boolean;
  trainingStarted: boolean;
  trainingStatus: TrainingStateType;
  lastFailedMessage: string | null;
  panelWidth: number;
  isResizing: boolean;
}

export interface TrainingActions {
  setMessages: (messages: BaseMessage[]) => void;
  addMessage: (message: BaseMessage) => void;
  setScenario: (scenario: ScenarioGeneratorSchema | null) => void;
  setPersona: (persona: PersonaGeneratorSchema | null) => void;
  setCustomScenario: (scenario: string) => void;
  setCustomPersona: (persona: string) => void;
  setIsRefiningScenario: (isRefining: boolean) => void;
  setIsRefiningPersona: (isRefining: boolean) => void;
  setError: (message: string | null, type: ErrorType | null) => void;
  clearError: () => void;
  setSessionFeedback: (feedback: FeedbackSchema | null) => void;
  setIsLoading: (loading: boolean) => void;
  setTrainingStarted: (started: boolean) => void;
  setTrainingStatus: (status: TrainingStateType) => void;
  setLastFailedMessage: (message: string | null) => void;
  setPanelWidth: (width: number) => void;
  setIsResizing: (resizing: boolean) => void;
  resetSession: () => void;
}

export interface TrainingContextType extends TrainingState, TrainingActions {}

export const trainingContext = createContext<TrainingContextType>({
  // State
  messages: [],
  scenario: null,
  persona: null,
  customScenario: "",
  customPersona: "",
  isRefiningScenario: false,
  isRefiningPersona: false,
  errorMessage: null,
  errorType: null,
  sessionFeedback: null,
  isLoading: false,
  trainingStarted: false,
  trainingStatus: "start",
  lastFailedMessage: null,
  panelWidth: 320,
  isResizing: false,
  // Actions
  setMessages: () => {},
  addMessage: () => {},
  setScenario: () => {},
  setPersona: () => {},
  setCustomScenario: () => {},
  setCustomPersona: () => {},
  setIsRefiningScenario: () => {},
  setIsRefiningPersona: () => {},
  setError: () => {},
  clearError: () => {},
  setSessionFeedback: () => {},
  setIsLoading: () => {},
  setTrainingStarted: () => {},
  setTrainingStatus: () => {},
  setLastFailedMessage: () => {},
  setPanelWidth: () => {},
  setIsResizing: () => {},
  resetSession: () => {},
});

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [sessionFeedback, setSessionFeedback] = useState<FeedbackSchema | null>(
    null
  );
  const [scenario, setScenario] = useState<ScenarioGeneratorSchema | null>(
    null
  );
  const [persona, setPersona] = useState<PersonaGeneratorSchema | null>(null);
  const [customScenario, setCustomScenario] = useState("");
  const [customPersona, setCustomPersona] = useState("");
  const [isRefiningScenario, setIsRefiningScenario] = useState(false);
  const [isRefiningPersona, setIsRefiningPersona] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStateType>("start");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // Action functions
  const addMessage = (message: BaseMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const setError = (message: string | null, type: ErrorType | null) => {
    setErrorMessage(message);
    setErrorType(type);
  };

  const clearError = () => {
    setErrorMessage(null);
    setErrorType(null);
  };

  const resetSession = () => {
    setMessages([]);
    setScenario(null);
    setPersona(null);
    setCustomScenario("");
    setCustomPersona("");
    setIsRefiningScenario(false);
    setIsRefiningPersona(false);
    setSessionFeedback(null);
    setTrainingStarted(false);
    setTrainingStatus("start");
    setLastFailedMessage(null);
    clearError();
  };

  const contextValue: TrainingContextType = {
    // State
    messages,
    scenario,
    persona,
    customScenario,
    customPersona,
    isRefiningScenario,
    isRefiningPersona,
    errorMessage,
    errorType,
    sessionFeedback,
    isLoading,
    trainingStarted,
    trainingStatus,
    lastFailedMessage,
    panelWidth,
    isResizing,
    // Actions
    setMessages,
    addMessage,
    setScenario,
    setPersona,
    setCustomScenario,
    setCustomPersona,
    setIsRefiningScenario,
    setIsRefiningPersona,
    setError,
    clearError,
    setSessionFeedback,
    setIsLoading,
    setTrainingStarted,
    setTrainingStatus,
    setLastFailedMessage,
    setPanelWidth,
    setIsResizing,
    resetSession,
  };

  return (
    <trainingContext.Provider value={contextValue}>
      {children}
    </trainingContext.Provider>
  );
}

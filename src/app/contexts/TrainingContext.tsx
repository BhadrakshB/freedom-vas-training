import { BaseMessage } from "@langchain/core/messages";
import { createContext, useState } from "react";
import {
  FeedbackSchema,
  PersonaGeneratorSchema,
  ScenarioGeneratorSchema,
  TrainingStateType,
  MessageRatingSchema,
  AlternativeSuggestionsSchema,
} from "../lib/agents/v2/graph_v2";
import { ErrorType } from "../lib/error-handling";

import { HumanMessage } from "@langchain/core/messages";

export interface ExtendedHumanMessage extends HumanMessage {
  messageRating: MessageRatingSchema | null;
  messageSuggestions: AlternativeSuggestionsSchema | null;

  toHumanMessage(): HumanMessage;
}

export class ExtendedHumanMessageImpl
  extends HumanMessage
  implements ExtendedHumanMessage
{
  messageRating: MessageRatingSchema | null;
  messageSuggestions: AlternativeSuggestionsSchema | null;

  constructor(
    content: string | any,
    messageRating: MessageRatingSchema | null = null,
    messageSuggestions: AlternativeSuggestionsSchema | null = null
  ) {
    super(content);
    this.messageRating = messageRating;
    this.messageSuggestions = messageSuggestions;
  }

  toHumanMessage(): HumanMessage {
    // Create a new HumanMessage with the same content and properties
    const humanMessage = new HumanMessage({
      content: this.content,
      additional_kwargs: this.additional_kwargs,
      response_metadata: this.response_metadata,
      id: this.id,
    });
    return humanMessage;
  }
}

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
  currentThreadId: string | null;
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
  setCurrentThreadId: (threadId: string | null) => void;
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
  currentThreadId: null,
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
  setCurrentThreadId: () => {},
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
  const [trainingStatus, setTrainingStatus] =
    useState<TrainingStateType>("start");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null
  );
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

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
    setCurrentThreadId(null);
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
    currentThreadId,
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
    setCurrentThreadId,
    resetSession,
  };

  return (
    <trainingContext.Provider value={contextValue}>
      {children}
    </trainingContext.Provider>
  );
}

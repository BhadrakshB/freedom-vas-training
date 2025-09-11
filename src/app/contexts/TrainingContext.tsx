import { BaseMessage } from "@langchain/core/messages";
import { createContext, useState } from "react";
import { FeedbackSchema, PersonaGeneratorSchema, ScenarioGeneratorSchema } from "../lib/agents/v2/graph_v2";
import { ErrorType } from "../lib/error-handling";

export interface TrainingState {
  messages: BaseMessage[],
  scenario: ScenarioGeneratorSchema | null,
  persona: PersonaGeneratorSchema | null,
  customScenario: string,
  customPersona: string,
  isRefiningScenario: boolean,
  isRefiningPersona: boolean,
  errorMessage: string | null,
  errorType: ErrorType | null,
  sessionFeedback: FeedbackSchema | null

}

export const trainingContext = createContext<TrainingState>({
  messages: [],
  scenario: null,
  persona: null,
  customScenario: "",
  customPersona: "",
  isRefiningScenario: false,
  isRefiningPersona: false,
  errorMessage: null,
  errorType: null,
  sessionFeedback: null

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
    return (
        <trainingContext.Provider value={{messages, scenario, persona, customScenario, customPersona, isRefiningScenario, isRefiningPersona, errorMessage,errorType, sessionFeedback,}}>
            {children}
        </trainingContext.Provider>
    )
}
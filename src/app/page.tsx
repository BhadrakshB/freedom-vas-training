"use client";

import React, { useState } from "react";
import { ThemeToggle } from "./components/ThemeToggle";
import { MessageArea } from "./components/MessageArea";
import { MessageInput } from "./components/MessageInput";
import { Button } from "./components/ui/button";

import { Textarea } from "./components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import {
  startTrainingSession,
  updateTrainingSession,
  refineScenario,
  refinePersona,
} from "./lib/actions/training-actions";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Sparkles } from "lucide-react";
import { ScenarioGeneratorSchema, PersonaGeneratorSchema } from "./lib/agents/v2/graph_v2";

export default function ChatPage() {
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [scenario, setScenario] = useState<ScenarioGeneratorSchema | null>(null);
  const [persona, setPersona] = useState<PersonaGeneratorSchema | null>(null);
  const [customScenario, setCustomScenario] = useState("");
  const [customPersona, setCustomPersona] = useState("");
  const [isRefiningScenario, setIsRefiningScenario] = useState(false);
  const [isRefiningPersona, setIsRefiningPersona] = useState(false);

  const handleStartTraining = async () => {
    setIsLoading(true);

    try {
      const params: { customScenario?: string; customPersona?: string } = {};

      if (customScenario.trim()) {
        params.customScenario = customScenario.trim();
      }

      if (customPersona.trim()) {
        params.customPersona = customPersona.trim();
      }

      const result = await startTrainingSession(params);

      if (result.error) {
        throw new Error(result.error);
      }

      // Store scenario and persona for future message updates
      setScenario(result.scenario ?? null);
      setPersona(result.guestPersona ?? null);
      setTrainingStarted(true);

      // Add initial training message
      const initialMessage: AIMessage = new AIMessage(
        `${
          (result.finalOutput as string) ||
          "Training session started! You can now begin chatting with the guest."
        }`
      );

      setMessages([initialMessage]);
    } catch (error) {
      console.error("Error starting training session:", error);

      // Add error message to chat
      const errorMessage: AIMessage = new AIMessage(
        `${"Sorry, there was an error starting the training session. Please try again."}`
      );

      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!trainingStarted || !scenario || !persona) {
      return;
    }

    const newMessage: HumanMessage = new HumanMessage(content);

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const result = await updateTrainingSession({
        scenario,
        guestPersona: persona,
        messages: updatedMessages,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Add the guest response
      const guestMessage: AIMessage = new AIMessage(
        `${(result.guestResponse as string) || "No response received."}`
      );

      setMessages((prev) => [...prev, guestMessage]);
    } catch (error) {
      console.error("Error updating training session:", error);

      // Add error message to chat
      const errorMessage: AIMessage = new AIMessage(
        "Sorry, there was an error processing your message. Please try again."
      );

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineScenario = async () => {
    if (!customScenario.trim()) return;

    setIsRefiningScenario(true);
    try {
      const result = await refineScenario({ scenario: customScenario });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.refinedScenario) {
        // Update the scenario text with the refined version
        const refinedText = formatRefinedScenario(result.refinedScenario);
        setCustomScenario(refinedText);
      }
    } catch (error) {
      console.error("Error refining scenario:", error);
      // You could add a toast notification here
    } finally {
      setIsRefiningScenario(false);
    }
  };

  const handleRefinePersona = async () => {
    if (!customPersona.trim()) return;

    setIsRefiningPersona(true);
    try {
      const result = await refinePersona({ persona: customPersona });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.refinedPersona) {
        // Update the persona text with the refined version
        const refinedText = formatRefinedPersona(result.refinedPersona);
        setCustomPersona(refinedText);
      }
    } catch (error) {
      console.error("Error refining persona:", error);
      // You could add a toast notification here
    } finally {
      setIsRefiningPersona(false);
    }
  };

  const formatRefinedScenario = (refinedScenario: ScenarioGeneratorSchema): string => {
    if (typeof refinedScenario === "string") {
      return refinedScenario;
    }

    let formatted = "";
    if (refinedScenario.scenario_title) {
      formatted += `${refinedScenario.scenario_title}\n\n`;
    }
    if (refinedScenario.guest_situation) {
      formatted += `Situation: ${refinedScenario.guest_situation}\n\n`;
    }
    if (refinedScenario.difficulty_level) {
      formatted += `Difficulty Level: ${refinedScenario.difficulty_level}\n\n`;
    }
    if (refinedScenario.business_context) {
      formatted += `Context: ${refinedScenario.business_context}\n\n`;
    }
    if (refinedScenario.expected_va_challenges) {
      formatted += `Expected Challenges: ${refinedScenario.expected_va_challenges}`;
    }

    return formatted.trim() || JSON.stringify(refinedScenario, null, 2);
  };

  const formatRefinedPersona = (refinedPersona: PersonaGeneratorSchema): string => {
    if (typeof refinedPersona === "string") {
      return refinedPersona;
    }

    let formatted = "";
    if (refinedPersona.name) {
      formatted += `${refinedPersona.name}\n\n`;
    }
    if (refinedPersona.demographics) {
      formatted += `Demographics: ${refinedPersona.demographics}\n\n`;
    }

    if (refinedPersona.personality_traits) {
      formatted += `Personality Traits: ${refinedPersona.personality_traits}\nn`;
    }
    if (refinedPersona.emotional_tone) {
      formatted += `Emotional Tone: ${refinedPersona.emotional_tone}\n\n`;
    }
    if (refinedPersona.communication_style) {
      formatted += `Communication Style: ${refinedPersona.communication_style}`;
    }

    return formatted.trim() || JSON.stringify(refinedPersona, null, 2);
  };

  return (
    <div className="h-screen flex flex-col bg-background relative">
      {/* Header Section */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate pr-2">
          STR Virtual Assistant Training
        </h1>
        <ThemeToggle className="shrink-0" />
      </header>

      {/* Message Area - Center with flex-1 growth */}
      <main className="flex-1 overflow-hidden">
        {!trainingStarted ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Ready to Start Training?
              </h2>
              <p className="text-muted-foreground max-w-md">
                Customize your training using the floating panels, or leave them
                blank for AI-generated content.
              </p>
              <Button
                onClick={() => {
                  handleStartTraining();
                }}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? "Starting Training..." : "Start Training Session"}
              </Button>
            </div>
          </div>
        ) : (
          <MessageArea messages={messages} className="h-full" />
        )}
      </main>

      {/* Message Input - Fixed at bottom */}
      {trainingStarted && (
        <footer className="shrink-0">
          <MessageInput
            onSendMessage={(message) => {
              handleSendMessage(message);
            }}
            placeholder="Type your message to the guest..."
            className="border-t-0"
            disabled={isLoading}
          />
        </footer>
      )}

      {/* Floating Panels */}
      <div className="absolute right-4 top-20 bottom-4 w-80 flex flex-col gap-4 z-10 overflow-y-auto pointer-events-none">
        <div className="pointer-events-auto">
          {!trainingStarted ? (
            <>
              {/* Custom Scenario Input Panel */}
              <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border shadow-lg mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Custom Scenario
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefineScenario}
                      disabled={
                        isLoading ||
                        isRefiningScenario ||
                        !customScenario.trim()
                      }
                      className="h-7 px-2 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {isRefiningScenario ? "Refining..." : "Refine"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    placeholder="e.g., Guest complaining about noise from neighboring unit..."
                    value={customScenario}
                    onChange={(e) => setCustomScenario(e.target.value)}
                    className="min-h-24 text-sm"
                    disabled={isLoading || isRefiningScenario}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Leave blank for AI-generated scenario or use the refine
                    button to enhance your input
                  </p>
                </CardContent>
              </Card>

              {/* Custom Persona Input Panel */}
              <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Custom Guest Persona
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefinePersona}
                      disabled={
                        isLoading || isRefiningPersona || !customPersona.trim()
                      }
                      className="h-7 px-2 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {isRefiningPersona ? "Refining..." : "Refine"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    placeholder="e.g., Frustrated business traveler, first-time Airbnb user..."
                    value={customPersona}
                    onChange={(e) => setCustomPersona(e.target.value)}
                    className="text-sm"
                    disabled={isLoading || isRefiningPersona}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Leave blank for AI-generated persona or use the refine
                    button to enhance your input
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Generated Scenario Display Panel */}
              {scenario && (
                <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border shadow-lg mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Training Scenario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Title
                      </h4>
                      <p className="text-sm">{scenario.scenario_title}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Situation
                      </h4>
                      <p className="text-sm">{scenario.guest_situation}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Difficulty
                      </h4>
                      <p className="text-sm">{scenario.difficulty_level}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generated Persona Display Panel */}
              {persona && (
                <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Guest Persona
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Name
                      </h4>
                      <p className="text-sm">{persona.name}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Demographics
                      </h4>
                      <p className="text-sm">{persona.demographics}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Emotional Tone
                      </h4>
                      <p className="text-sm">{persona.emotional_tone}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">
                        Communication Style
                      </h4>
                      <p className="text-sm">{persona.communication_style}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

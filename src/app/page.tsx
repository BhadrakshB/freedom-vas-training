"use client";
import { useState, useEffect, useRef } from "react";
import { TrainingProvider, useTraining } from "./contexts/TrainingContext";
import { ChatLoadingProvider, useChatLoading } from "./contexts/ChatLoadingContext";
import { TrainingLoadingProvider, useTrainingLoading } from "./contexts/TrainingLoadingContext";
import { getChatSessionManager } from "./lib/chat-session-manager";
import { getTrainingSessionManager } from "./lib/training-session-manager";
import { TrainingPanel } from "./components/TrainingPanel";
import { FeedbackInterface } from "./components/FeedbackInterface";
import { ThemeToggle } from "./components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Skeleton } from "./components/ui/skeleton";
import { ErrorAlert } from "./components/ErrorAlert";
import { Maximize2, Minimize2, X, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "./components/ui";



// Main content component that uses the training context
function MainContent() {
  const {
    state,
    startSession,
    completeSession,
    enterFeedbackPhase,
    exitFeedbackPhase,
    setError,
    isTrainingActive,
    isFeedbackActive,
  } = useTraining();

  // Use isolated loading contexts
  const chatLoading = useChatLoading();
  const trainingLoading = useTrainingLoading();

  // Use isolated session managers
  const chatSessionManager = getChatSessionManager();
  const trainingSessionManager = getTrainingSessionManager();

  const [input, setInput] = useState("");
  const [panelMode, setPanelMode] = useState<"hidden" | "half" | "full">(
    "hidden"
  );
  const [chatSessionState, setChatSessionState] = useState(chatSessionManager.getSessionState());

  const conversationEndRef = useRef<HTMLDivElement>(null);

  async function run() {
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");
    chatLoading.setLoading(true, 'message-send');

    try {
      // Use ChatSessionManager for independent chat handling
      await chatSessionManager.sendMessage(currentInput, "general", "anonymous");
      setChatSessionState(chatSessionManager.getSessionState());
    } catch (error) {
      console.error("Chat error:", error);
      // Error is already handled by the session manager
      setChatSessionState(chatSessionManager.getSessionState());
    } finally {
      chatLoading.setLoading(false);
    }
  }

  async function startTrainingSession() {
    try {
      trainingLoading.setLoading(true, 'session-start', 'Creating your personalized training scenario...');
      
      // Use TrainingSessionManager for independent training handling
      const sessionId = await trainingSessionManager.startSession({
        difficulty: "beginner",
        category: "general",
        trainingObjective: "To test new guy",
      });
      
      // Update TrainingContext with the new session
      startSession(sessionId);
    } catch (error) {
      console.error("Failed to start training session:", error);
      setError(error);
    } finally {
      trainingLoading.setLoading(false);
    }
  }

  async function sendTrainingMessage(message: string) {
    if (!state.activeSessionId) return;

    try {
      // Use TrainingSessionManager for independent training message handling
      await trainingSessionManager.sendMessage(state.activeSessionId, message);
    } catch (error) {
      console.error("Failed to send training message:", error);
      throw error;
    }
  }

  // Check for session completion and trigger feedback display
  useEffect(() => {
    if (!state.activeSessionId) return;

    const checkSessionStatus = async () => {
      try {
        // Use TrainingSessionManager for independent status checking
        const status = await trainingSessionManager.getSessionStatus(state.activeSessionId!);
        
        if (status === "complete" && !state.showFeedback) {
          // Complete session in both managers
          trainingSessionManager.completeSession(state.activeSessionId!);
          completeSession(state.activeSessionId!);
          
          // Small delay to allow UI to update before entering feedback phase
          setTimeout(() => {
            enterFeedbackPhase(state.activeSessionId!);
          }, 500);
        }
      } catch (error) {
        console.error("Failed to check session status:", error);
        // Only set error if it's not a network timeout (to avoid spam during normal polling)
        if (error instanceof Error && !error.message.includes("fetch")) {
          setError(error);
        }
      }
    };

    // Initial check
    checkSessionStatus();

    // Set up polling interval
    const interval = setInterval(checkSessionStatus, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [
    state.activeSessionId,
    state.showFeedback,
    completeSession,
    enterFeedbackPhase,
    setError,
    trainingSessionManager,
  ]);

  const handleCloseFeedback = () => {
    exitFeedbackPhase();
  };

  const handleStartNewSession = () => {
    exitFeedbackPhase();
    startTrainingSession();
  };

  const clearConversation = () => {
    chatSessionManager.clearHistory();
    setChatSessionState(chatSessionManager.getSessionState());
  };

  // Initialize chat session on mount
  useEffect(() => {
    chatSessionManager.startSession();
    setChatSessionState(chatSessionManager.getSessionState());
  }, [chatSessionManager]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatSessionState.conversationHistory]);

  const getPanelClasses = () => {
    const baseClasses =
      "fixed right-2 top-2 md:right-4 md:top-4 z-50 transition-all duration-300 ease-in-out shadow-lg";

    switch (panelMode) {
      case "full":
        return `${baseClasses} w-[calc(100vw-1rem)] md:w-[calc(100vw-2rem)] h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)]`;
      case "half":
        return `${baseClasses} w-80 md:w-96 h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)]`;
      case "hidden":
      default:
        return `${baseClasses} w-80 md:w-96 h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] translate-x-full opacity-0 pointer-events-none`;
    }
  };

  return (
    <div className="relative h-screen">
      {/* Main Chat Area - Full Width */}
      <main
        className={`w-full h-full flex flex-col transition-all duration-300 ${
          isTrainingActive
            ? "bg-blue-50/50 dark:bg-blue-950/20"
            : isFeedbackActive
            ? "bg-green-50/50 dark:bg-green-950/20"
            : "bg-background"
        }`}
      >
        {/* Header with visual distinction */}
        <Card
          className={`rounded-none border-x-0 border-t-0 transition-colors duration-300 ${
            isTrainingActive
              ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
              : isFeedbackActive
              ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
              : "bg-background"
          }`}
        >
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle
                className={`text-xl md:text-2xl transition-colors duration-300 ${
                  isTrainingActive
                    ? "text-blue-900 dark:text-blue-100"
                    : isFeedbackActive
                    ? "text-green-900 dark:text-green-100"
                    : "text-foreground"
                }`}
              >
                AI Training Simulator
              </CardTitle>

              {/* Controls */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Phase indicator */}
                <Badge
                  variant={
                    isTrainingActive
                      ? "default"
                      : isFeedbackActive
                      ? "secondary"
                      : "outline"
                  }
                  className={`text-xs md:text-sm ${
                    isTrainingActive
                      ? "bg-blue-600 hover:bg-blue-700"
                      : isFeedbackActive
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : ""
                  }`}
                >
                  {state.phase === "training"
                    ? "Training Active"
                    : state.phase === "feedback"
                    ? "Feedback Phase"
                    : state.phase === "complete"
                    ? "Session Complete"
                    : "Ready"}
                </Badge>

                {/* Training Panel Toggle */}
                <Button
                  variant={panelMode !== "hidden" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setPanelMode(panelMode === "hidden" ? "half" : "hidden")
                  }
                  className="gap-2"
                >
                  {panelMode !== "hidden" ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {panelMode !== "hidden" ? "Hide Panel" : "Show Panel"}
                  </span>
                  <span className="sm:hidden">
                    {panelMode !== "hidden" ? "Hide" : "Show"}
                  </span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          {isFeedbackActive && state.completedSessionId ? (
            <FeedbackInterface
              sessionId={state.completedSessionId}
              onClose={handleCloseFeedback}
              className="h-full"
            />
          ) : (
            <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
              {/* Session starting loading state */}
              {trainingLoading.isLoading &&
                trainingLoading.state.type === 'session-start' &&
                !isTrainingActive &&
                !isFeedbackActive &&
                state.phase === "idle" && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-center">
                      <div className="space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <div className="font-semibold text-blue-900 text-lg">
                          Starting Training Session
                        </div>
                        <p className="text-blue-800">
                          Creating your personalized training scenario...
                        </p>
                        <div className="space-y-2 max-w-md mx-auto">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-3/4 mx-auto" />
                          <Skeleton className="h-3 w-1/2 mx-auto" />
                        </div>
                        <p className="text-sm text-blue-700">
                          This may take a few moments...
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

              {isTrainingActive ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse mr-4"></div>
                    <div className="flex-1">
                      <AlertDescription className="text-blue-900">
                        <div className="font-semibold text-lg mb-2">
                          Training Session in Progress
                        </div>
                        <p className="text-blue-800 mb-3">
                          Use the training panel on the right to interact with
                          your guest. This main area will display your detailed
                          feedback once the session is complete.
                        </p>
                        {state.scenario && (
                          <Card className="bg-blue-100 border-blue-200">
                            <CardContent className="pt-3">
                              <p className="text-sm text-blue-700">
                                <strong>Current Scenario:</strong>{" "}
                                {state.scenario.title}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ) : state.phase === "complete" ? (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-center">
                    <div className="text-green-600 text-4xl mb-4">🎉</div>
                    <div className="font-semibold text-green-900 text-lg mb-2">
                      Session Complete!
                    </div>
                    <p className="text-green-800 mb-4">
                      Your training session has been completed. Generating
                      detailed feedback...
                    </p>
                    <div className="space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <div className="space-y-2 max-w-md mx-auto">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4 mx-auto" />
                        <Skeleton className="h-3 w-1/2 mx-auto" />
                      </div>
                      <p className="text-sm text-green-700">
                        Analyzing performance and generating recommendations...
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground mb-4">
                        Welcome to the AI Training Simulator. Start a training
                        session to practice your skills, or use the general
                        assistant below.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Conversation History */}
                  {chatSessionState.conversationHistory.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Conversation
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearConversation}
                            disabled={chatLoading.isLoading}
                          >
                            Clear
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                        {chatSessionState.conversationHistory.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.role === "user"
                                  ? "bg-blue-500 text-white ml-4"
                                  : "bg-muted text-foreground mr-4"
                              }`}
                            >
                              <div className="whitespace-pre-wrap text-sm">
                                {message.content}
                              </div>
                              <div
                                className={`text-xs mt-1 opacity-70 ${
                                  message.role === "user"
                                    ? "text-blue-100"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={conversationEndRef} />
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Describe a task..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          disabled={isTrainingActive || chatLoading.isLoading}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              run();
                            }
                          }}
                        />
                        <Button
                          onClick={run}
                          disabled={
                            chatLoading.isLoading || isTrainingActive || !input.trim()
                          }
                        >
                          {chatLoading.isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              Thinking...
                            </div>
                          ) : (
                            "Send"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Loading state for response */}
                  {chatLoading.isLoading && (
                    <Card>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          <span>Processing your request...</span>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Error display */}
              {state.error && (
                <ErrorAlert
                  error={state.error}
                  onRetry={() => window.location.reload()}
                  onDismiss={() => setError(undefined)}
                  className="mb-4"
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Training Panel */}
      {panelMode !== "hidden" && (
        <Card className={getPanelClasses()}>
          {/* Panel Header with Controls */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Training Panel</CardTitle>
              <div className="flex items-center gap-2">
                {/* Size Toggle Buttons */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setPanelMode(panelMode === "half" ? "full" : "half")
                  }
                  title={
                    panelMode === "half"
                      ? "Expand to fullscreen"
                      : "Minimize to half screen"
                  }
                  className="h-8 w-8"
                >
                  {panelMode === "half" ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPanelMode("hidden")}
                  title="Close panel"
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Panel Content */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <TrainingPanel
              sessionId={state.activeSessionId}
              onStartSession={handleStartNewSession}
              onSendMessage={sendTrainingMessage}
              className="h-full border-0 rounded-none"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Main app component with provider
export default function Home() {
  return (
    <TrainingProvider>
      <ChatLoadingProvider>
        <TrainingLoadingProvider>
          <MainContent />
        </TrainingLoadingProvider>
      </ChatLoadingProvider>
    </TrainingProvider>
  );
}

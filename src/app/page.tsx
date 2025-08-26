"use client";
import { useState, useEffect } from "react";
import { TrainingProvider, useTraining } from "./contexts/TrainingContext";
import { TrainingPanel } from "./components/TrainingPanel";
import { FeedbackInterface } from "./components/FeedbackInterface";

interface ChatRequest {
  message: string;
  userId?: string;
  context?: 'general' | 'performance_review' | 'training_advice' | 'session_analysis';
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
}

interface ChatResponse {
  response: string;
  suggestedActions?: string[];
  sessionReferences?: string[];
  performanceInsights?: {
    totalSessions: number;
    averageScore: number;
    strongestSkill: string;
    improvementArea: string;
    recentTrend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
  };
  error?: string;
}


// Main content component that uses the training context
function MainContent() {

  const {
    state,
    startSession,
    completeSession,
    enterFeedbackPhase,
    exitFeedbackPhase,
    updateSessionData,
    setError,
    setLoading,
    isTrainingActive,
    isFeedbackActive,
    isLoading,
  } = useTraining();

  const [input, setInput] = useState("");
  const [resp, setResp] = useState<any>(null);
  const [panelMode, setPanelMode] = useState<'hidden' | 'half' | 'full'>('hidden');

  async function run() {
    setLoading(true);
    setResp(null);
    const r = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: input,
        userId: "anonymous",
        context: "general"
      } as ChatRequest),
      headers: { "Content-Type": "application/json" },
    });
    const j = await r.json();
    setResp(j);
    setLoading(false);
  }

  async function startTrainingSession() {
    try {
      setLoading(true);
      const response = await fetch("/api/training/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: "beginner",
          category: "general",
          trainingObjective: "To test new guy"
        })
      });

      if (response.ok) {
        const data = await response.json();
        startSession(data.sessionId);
      } else {
        throw new Error("Failed to start training session");
      }
    } catch (error) {
      console.error("Failed to start training session:", error);
      setError(error instanceof Error ? error.message : "Failed to start training session");
    } finally {
      setLoading(false);
    }
  }

  async function sendTrainingMessage(message: string) {
    if (!state.activeSessionId) return;

    try {
      const response = await fetch("/api/training/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.activeSessionId,
          userResponse: message,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }
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
        const response = await fetch(`/api/training/status?sessionId=${state.activeSessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.sessionStatus === 'complete' && !state.showFeedback) {
            completeSession(state.activeSessionId ?? '');
            // Small delay to allow UI to update before entering feedback phase
            setTimeout(() => {
              enterFeedbackPhase(state.activeSessionId!);
            }, 500);
          }
        }
      } catch (error) {
        console.error("Failed to check session status:", error);
        setError("Failed to check session status");
      }
    };

    const interval = setInterval(checkSessionStatus, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [state.activeSessionId, state.showFeedback, completeSession, enterFeedbackPhase, setError]);

  const handleCloseFeedback = () => {
    exitFeedbackPhase();
  };

  const handleStartNewSession = () => {
    exitFeedbackPhase();
    startTrainingSession();
  };

  const getPanelClasses = () => {
    const baseClasses = "fixed right-4 top-4 bg-white shadow-2xl rounded-lg border border-gray-200 z-50 transition-all duration-300 ease-in-out";

    switch (panelMode) {
      case 'full':
        return `${baseClasses} w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]`;
      case 'half':
        return `${baseClasses} w-96 h-[calc(100vh-2rem)]`;
      case 'hidden':
      default:
        return `${baseClasses} w-96 h-[calc(100vh-2rem)] translate-x-full opacity-0 pointer-events-none`;
    }
  };

  return (
    <div className="relative h-screen">
      {/* Main Chat Area - Full Width */}
      <main className={`w-full h-full flex flex-col transition-all duration-300 ${isTrainingActive ? 'bg-blue-50' : isFeedbackActive ? 'bg-green-50' : 'bg-white'
        }`}>
        {/* Header with visual distinction */}
        <div className={`border-b p-4 ${isTrainingActive
          ? 'bg-blue-100 border-blue-200'
          : isFeedbackActive
            ? 'bg-green-100 border-green-200'
            : 'bg-gray-50 border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-semibold ${isTrainingActive
              ? 'text-blue-900'
              : isFeedbackActive
                ? 'text-green-900'
                : 'text-gray-900'
              }`}>
              AI Training Simulator
            </h1>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Phase indicator */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${isTrainingActive
                ? 'bg-blue-200 text-blue-800'
                : isFeedbackActive
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-800'
                }`}>
                {state.phase === 'training' ? 'Training Active' :
                  state.phase === 'feedback' ? 'Feedback Phase' :
                    state.phase === 'complete' ? 'Session Complete' : 'Ready'}
              </div>

              {/* Training Panel Toggle */}
              <button
                onClick={() => setPanelMode(panelMode === 'hidden' ? 'half' : 'hidden')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${panelMode !== 'hidden'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {panelMode !== 'hidden' ? 'Hide Training Panel' : 'Show Training Panel'}
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          {isFeedbackActive && state.completedSessionId ? (
            <FeedbackInterface
              sessionId={state.completedSessionId}
              onClose={handleCloseFeedback}
              className="h-full"
            />
          ) : (
            <div className="p-6 max-w-2xl mx-auto space-y-4">
              {isTrainingActive ? (
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse mr-4"></div>
                    <div>
                      <h3 className="font-semibold text-blue-900 text-lg mb-2">Training Session in Progress</h3>
                      <p className="text-blue-800">
                        Use the training panel on the right to interact with your guest.
                        This main area will display your detailed feedback once the session is complete.
                      </p>
                      {state.scenario && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm text-blue-700">
                            <strong>Current Scenario:</strong> {state.scenario.title}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : state.phase === 'complete' ? (
                <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
                  <div className="text-green-600 text-4xl mb-4">🎉</div>
                  <h3 className="font-semibold text-green-900 text-lg mb-2">Session Complete!</h3>
                  <p className="text-green-800 mb-4">
                    Your training session has been completed. Generating detailed feedback...
                  </p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-gray-600 mb-4">
                      Welcome to the AI Training Simulator. Start a training session to practice your skills,
                      or use the general assistant below.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      className="border rounded px-3 py-2 flex-1 text-black"
                      placeholder="Describe a task..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isTrainingActive}
                    />
                    <button
                      onClick={run}
                      disabled={isLoading || isTrainingActive}
                      className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                    >
                      {isLoading ? "Thinking..." : "Run"}
                    </button>
                  </div>

                  {resp && (
                    <div className="rounded border p-4 space-y-2">
                      <pre className="whitespace-pre-wrap text-black">{String(resp.response ?? "")}</pre>
                    </div>
                  )}
                </>
              )}

              {/* Error display */}
              {state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-red-500 mr-3">⚠️</div>
                    <div>
                      <h3 className="font-medium text-red-900">Error</h3>
                      <p className="text-sm text-red-700">{state.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Training Panel */}
      {panelMode !== 'hidden' && (
        <div className={getPanelClasses()}>
          {/* Panel Header with Controls */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h3 className="font-semibold text-gray-900">Training Panel</h3>
            <div className="flex items-center gap-2">
              {/* Size Toggle Buttons */}
              <button
                onClick={() => setPanelMode(panelMode === 'half' ? 'full' : 'half')}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title={panelMode === 'half' ? 'Expand to fullscreen' : 'Minimize to half screen'}
              >
                {panelMode === 'half' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                  </svg>
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setPanelMode('hidden')}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Close panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            <TrainingPanel
              sessionId={state.activeSessionId}
              onStartSession={handleStartNewSession}
              onSendMessage={sendTrainingMessage}
              className="h-full border-0 rounded-none"
            />
          </div>
        </div>
      )}


    </div>
  );
}

// Main app component with provider
export default function Home() {
  return (
    <TrainingProvider>
      <MainContent />
    </TrainingProvider>
  );
}

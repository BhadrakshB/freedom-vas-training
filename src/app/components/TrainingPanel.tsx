"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SessionTimer } from './SessionTimer';
import { ProgressIndicator } from './ProgressIndicator';
import { TrainingInput } from './TrainingInput';
import { useTraining } from '../contexts/TrainingContext';

// Types for the training panel
interface TrainingPanelProps {
  sessionId?: string;
  onStartSession?: () => void;
  onSendMessage?: (message: string) => void;
  className?: string;
}

interface SessionStatus {
  sessionId: string;
  sessionStatus: 'creating' | 'active' | 'complete';
  scenario?: {
    title: string;
    description: string;
    required_steps: string[];
  };
  persona?: {
    name: string;
    background: string;
    communication_style: string;
  };
  progress: {
    currentTurn: number;
    completedSteps: string[];
    requiredSteps: string[];
    completionPercentage: number;
  };
  scores?: {
    policy_adherence: number;
    empathy_index: number;
    completeness: number;
    escalation_judgment: number;
    time_efficiency: number;
    overall: number;
  };
  sessionDuration: number;
  lastActivity: string;
  criticalErrors: string[];
}

export const TrainingPanel: React.FC<TrainingPanelProps> = ({
  sessionId,
  onStartSession,
  onSendMessage,
  className = ""
}) => {
  const {
    state,
    updateSessionData,
    setError: setContextError,
    setLoading: setContextLoading,
    panelTitle,
    isTrainingActive,
    isFeedbackActive,
  } = useTraining();

  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch session status
  const fetchSessionStatus = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/training/status?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch session status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSessionStatus(data);
      setError(null);
      
      // Update context with session data
      updateSessionData({
        sessionStatus: data.sessionStatus,
        scenario: data.scenario,
        persona: data.persona,
        scores: data.scores,
        progress: data.progress,
        sessionDuration: data.sessionDuration,
        criticalErrors: data.criticalErrors || [],
      });
    } catch (err) {
      console.error('Error fetching session status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session status';
      setError(errorMessage);
      setContextError(errorMessage);
    }
  }, [sessionId, updateSessionData, setContextError]);

  // Poll for session updates when active
  useEffect(() => {
    if (!sessionId || !isPolling) return;

    const interval = setInterval(fetchSessionStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [sessionId, isPolling, fetchSessionStatus]);

  // Initial fetch and start polling when session becomes active
  useEffect(() => {
    if (sessionId) {
      fetchSessionStatus();
      setIsPolling(true);
    } else {
      setIsPolling(false);
      setSessionStatus(null);
    }
  }, [sessionId, fetchSessionStatus]);

  // Stop polling when session is complete
  useEffect(() => {
    if (sessionStatus?.sessionStatus === 'complete') {
      setIsPolling(false);
    }
  }, [sessionStatus?.sessionStatus]);

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (!sessionId || !onSendMessage || state.isPanelFrozen) return;

    setLoading(true);
    setContextLoading(true);
    try {
      await onSendMessage(message);
      // Refresh session status after sending message
      setTimeout(fetchSessionStatus, 500);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setContextError(errorMessage);
    } finally {
      setLoading(false);
      setContextLoading(false);
    }
  };

  // Determine panel styling based on state
  const getPanelStyling = () => {
    if (state.isPanelFrozen) {
      return 'bg-gray-50 border-l-4 border-gray-400';
    }
    if (isTrainingActive) {
      return 'bg-blue-50 border-l-4 border-blue-500';
    }
    if (isFeedbackActive) {
      return 'bg-green-50 border-l-4 border-green-500';
    }
    return 'bg-white border-l border-gray-200';
  };

  // Render different states
  if (!sessionId) {
    return (
      <div className={`${getPanelStyling()} p-4 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {panelTitle}
          </h3>
          <p className="text-gray-600 mb-4">
            Start a training session to practice your skills with AI-generated scenarios.
          </p>
          <button
            onClick={onStartSession}
            disabled={state.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {state.isLoading ? 'Starting...' : 'Start Training Session'}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${getPanelStyling()} p-4 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️ Error</div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSessionStatus}
            disabled={state.isPanelFrozen}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!sessionStatus) {
    return (
      <div className={`${getPanelStyling()} p-4 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  const isSessionComplete = sessionStatus.sessionStatus === 'complete' || state.isPanelFrozen;

  return (
    <div className={`${getPanelStyling()} flex flex-col ${className} ${
      state.isPanelFrozen ? 'opacity-90' : ''
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${state.isPanelFrozen ? 'border-gray-300 bg-gray-100' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-lg font-semibold ${state.isPanelFrozen ? 'text-gray-600' : 'text-gray-900'}`}>
            {panelTitle}
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            state.isPanelFrozen
              ? 'bg-gray-200 text-gray-700'
              : sessionStatus.sessionStatus === 'active' 
              ? 'bg-green-100 text-green-800'
              : sessionStatus.sessionStatus === 'complete'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {state.isPanelFrozen ? 'Frozen' :
             sessionStatus.sessionStatus === 'active' ? 'Active' : 
             sessionStatus.sessionStatus === 'complete' ? 'Complete' : 'Creating'}
          </div>
        </div>
        
        <SessionTimer 
          startTime={new Date(Date.now() - sessionStatus.sessionDuration)}
          isActive={!isSessionComplete && !state.isPanelFrozen}
        />
        
        {state.isPanelFrozen && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            🔒 Panel is frozen - session complete or in feedback phase
          </div>
        )}
      </div>

      {/* Scenario Info */}
      {sessionStatus.scenario && (
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-medium text-gray-900 mb-1">
            {sessionStatus.scenario.title}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            {sessionStatus.scenario.description}
          </p>
          {sessionStatus.persona && (
            <div className="text-xs text-gray-500">
              Guest: {sessionStatus.persona.name}
            </div>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="p-4 border-b border-gray-100">
        <ProgressIndicator
          completedSteps={sessionStatus.progress.completedSteps}
          requiredSteps={sessionStatus.progress.requiredSteps}
          completionPercentage={sessionStatus.progress.completionPercentage}
          currentTurn={sessionStatus.progress.currentTurn}
          criticalErrors={sessionStatus.criticalErrors}
        />
      </div>

      {/* Scores (if available) */}
      {sessionStatus.scores && (
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-medium text-gray-900 mb-2">Current Scores</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Overall:</span>
              <span className="font-medium">{sessionStatus.scores.overall}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Policy:</span>
              <span>{sessionStatus.scores.policy_adherence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Empathy:</span>
              <span>{sessionStatus.scores.empathy_index}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Session Complete Message */}
      {isSessionComplete && (
        <div className={`p-4 border-b border-gray-100 ${
          state.isPanelFrozen ? 'bg-gray-100' : 'bg-blue-50'
        }`}>
          <div className="text-center">
            <div className={`font-medium mb-1 ${
              state.isPanelFrozen ? 'text-gray-600' : 'text-blue-600'
            }`}>
              {state.phase === 'feedback' ? '📋 Reviewing Feedback' : '🎉 Session Complete!'}
            </div>
            <p className={`text-sm ${
              state.isPanelFrozen ? 'text-gray-600' : 'text-blue-700'
            }`}>
              {state.phase === 'feedback' 
                ? 'Feedback is being displayed in the main chat area.'
                : 'Check the main chat for detailed feedback.'}
            </p>
            {sessionStatus.scores && (
              <div className={`mt-2 text-lg font-bold ${
                state.isPanelFrozen ? 'text-gray-700' : 'text-blue-800'
              }`}>
                Final Score: {sessionStatus.scores.overall}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-1 flex flex-col">
        <TrainingInput
          onSendMessage={handleSendMessage}
          disabled={isSessionComplete || loading || state.isPanelFrozen}
          loading={loading || state.isLoading}
          placeholder={
            state.isPanelFrozen
              ? "Panel is frozen - session complete or in feedback phase"
              : isSessionComplete 
              ? "Session complete - check main chat for feedback"
              : "Type your response to the guest..."
          }
        />
      </div>
    </div>
  );
};
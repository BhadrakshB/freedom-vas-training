"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SessionTimer } from './SessionTimer';
import { ProgressIndicator } from './ProgressIndicator';
import { TrainingInput } from './TrainingInput';
import { TrainingLoadingIndicator } from './TrainingLoadingIndicator';
import { useTraining } from '../contexts/TrainingContext';
import { useTrainingLoading } from '../contexts/TrainingLoadingContext';
import { getTrainingSessionManager } from '../lib/training-session-manager';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge, 
  Button, 
  Skeleton, 
  Alert,
  AlertDescription
} from './ui';
import { TrainingErrorDisplay } from './TrainingErrorDisplay';

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
    panelTitle,
    isTrainingActive,
    isFeedbackActive,
  } = useTraining();

  const {
    setLoading: setTrainingLoading,
    setError: setTrainingError,
    clearError: clearTrainingError,
    isLoading: trainingIsLoading,
    errorHandler: trainingErrorHandler,
    currentError: trainingCurrentError
  } = useTrainingLoading();

  // Use TrainingSessionManager for independent session handling
  const trainingSessionManager = getTrainingSessionManager();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch session status using TrainingSessionManager
  const fetchSessionStatus = useCallback(async () => {
    if (!sessionId) return;

    setTrainingLoading(true, 'status-check');
    try {
      // Use TrainingSessionManager for independent status checking
      await trainingSessionManager.getSessionStatus(sessionId);
      const sessionData = trainingSessionManager.getSessionData(sessionId);
      
      if (sessionData) {
        // Convert to expected format for UI
        const statusData: SessionStatus = {
          sessionId: sessionData.sessionId,
          sessionStatus: sessionData.status,
          scenario: sessionData.scenario,
          persona: sessionData.persona,
          progress: sessionData.progress,
          scores: sessionData.scores,
          sessionDuration: sessionData.sessionDuration,
          lastActivity: new Date().toISOString(),
          criticalErrors: sessionData.criticalErrors,
        };
        
        setSessionStatus(statusData);
        setError(null);
        clearTrainingError();
        
        // Update context with session data
        updateSessionData({
          sessionStatus: sessionData.status,
          scenario: sessionData.scenario,
          persona: sessionData.persona,
          scores: sessionData.scores,
          progress: sessionData.progress,
          sessionDuration: sessionData.sessionDuration,
          criticalErrors: sessionData.criticalErrors || [],
        });
      }

    } catch (err) {
      console.error('Error fetching session status:', err);
      
      // Set the retry action for the error handler
      const retryAction = async () => {
        await fetchSessionStatus();
      };
      trainingErrorHandler.setLastAction(retryAction);
      trainingErrorHandler.setSessionId(sessionId);
      
      const appError = trainingErrorHandler.handleError(err);
      setError(appError.message);
      setTrainingError(appError.message);
      setContextError(err);
    } finally {
      setTrainingLoading(false);
    }
  }, [sessionId, updateSessionData, setContextError, setTrainingLoading, setTrainingError, clearTrainingError, trainingErrorHandler, trainingSessionManager]);

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

  // Handle sending messages using TrainingSessionManager
  const handleSendMessage = async (message: string) => {
    if (!sessionId || state.isPanelFrozen) return;

    setTrainingLoading(true, 'message-send');
    try {
      // Use TrainingSessionManager for independent message sending
      await trainingSessionManager.sendMessage(sessionId, message);
      
      // Also call the parent callback if provided (for compatibility)
      if (onSendMessage) {
        await onSendMessage(message);
      }
      
      // Refresh session status after sending message
      setTimeout(fetchSessionStatus, 500);
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Set the retry action for the error handler
      const retryAction = async () => {
        if (onSendMessage) {
          await onSendMessage(message);
        }
        setTimeout(fetchSessionStatus, 500);
      };
      trainingErrorHandler.setLastAction(retryAction);
      
      const appError = trainingErrorHandler.handleError(err);
      setError(appError.message);
      setTrainingError(appError.message);
      setContextError(err);
    } finally {
      setTrainingLoading(false);
    }
  };

  // Determine panel variant based on state
  const getPanelVariant = () => {
    if (state.isPanelFrozen) return 'frozen';
    if (isTrainingActive) return 'training';
    if (isFeedbackActive) return 'feedback';
    return 'default';
  };

  const getPanelClassName = () => {
    const variant = getPanelVariant();
    const baseClasses = 'h-full flex flex-col';
    
    switch (variant) {
      case 'frozen':
        return `${baseClasses} opacity-90 border-l-4 border-muted`;
      case 'training':
        return `${baseClasses} border-l-4 border-blue-500`;
      case 'feedback':
        return `${baseClasses} border-l-4 border-green-500`;
      default:
        return `${baseClasses} border-l border-border`;
    }
  };

  // Render different states
  if (!sessionId) {
    return (
      <Card className={`${getPanelClassName()} ${className}`}>
        <CardContent className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <CardTitle className="text-lg">
              {panelTitle}
            </CardTitle>
            <p className="text-muted-foreground">
              Start a training session to practice your skills with AI-generated scenarios.
            </p>
            <Button
              onClick={onStartSession}
              disabled={trainingIsLoading}
              className="w-full"
            >
              {trainingIsLoading ? 'Starting...' : 'Start Training Session'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${getPanelClassName()} ${className}`}>
        <CardContent className="flex-1 flex items-center justify-center p-6">
          <TrainingErrorDisplay
            error={trainingCurrentError}
            errorHandler={trainingErrorHandler}
            onSessionRestart={() => {
              // Clear error and restart session
              trainingErrorHandler.clearError();
              setError(null);
              onStartSession?.();
            }}
            className="max-w-md"
          />
        </CardContent>
      </Card>
    );
  }

  if (!sessionStatus) {
    return (
      <Card className={`${getPanelClassName()} ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24" />
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Scenario loading skeleton */}
          <div className="space-y-2 p-4 border rounded-lg">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          
          {/* Progress loading skeleton */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Input area loading skeleton */}
          <div className="space-y-2 p-4 border-t">
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
        
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <TrainingLoadingIndicator type="status-check" />
        </div>
      </Card>
    );
  }

  const isSessionComplete = sessionStatus.sessionStatus === 'complete' || state.isPanelFrozen;

  const getStatusBadgeVariant = () => {
    if (state.isPanelFrozen) return 'secondary';
    switch (sessionStatus.sessionStatus) {
      case 'active': return 'default';
      case 'complete': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = () => {
    if (state.isPanelFrozen) return 'Frozen';
    switch (sessionStatus.sessionStatus) {
      case 'active': return 'Active';
      case 'complete': return 'Complete';
      default: return 'Creating';
    }
  };

  return (
    <Card className={`${getPanelClassName()} ${className}`}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">
            {panelTitle}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant()}>
            {getStatusText()}
          </Badge>
        </div>
        
        <SessionTimer 
          startTime={new Date(Date.now() - sessionStatus.sessionDuration)}
          isActive={!isSessionComplete && !state.isPanelFrozen}
        />
        
        {state.isPanelFrozen && (
          <Alert className="mt-2">
            <AlertDescription className="text-xs">
              🔒 Panel is frozen - session complete or in feedback phase
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      {/* Scenario Info */}
      {sessionStatus.scenario && (
        <CardContent className="py-4 border-b">
          <div className="space-y-2">
            <h4 className="font-medium">
              {sessionStatus.scenario.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {sessionStatus.scenario.description}
            </p>
            {sessionStatus.persona && (
              <Badge variant="outline" className="text-xs">
                Guest: {sessionStatus.persona.name}
              </Badge>
            )}
          </div>
        </CardContent>
      )}

      {/* Progress Indicator */}
      <CardContent className="py-4 border-b">
        <ProgressIndicator
          completedSteps={sessionStatus.progress.completedSteps}
          requiredSteps={sessionStatus.progress.requiredSteps}
          completionPercentage={sessionStatus.progress.completionPercentage}
          currentTurn={sessionStatus.progress.currentTurn}
          criticalErrors={sessionStatus.criticalErrors}
          loading={trainingIsLoading}
        />
      </CardContent>

      {/* Scores (if available) */}
      {sessionStatus.scores && (
        <CardContent className="py-4 border-b">
          <div className="space-y-3">
            <h4 className="font-medium">Current Scores</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overall:</span>
                <Badge variant="secondary" className="font-medium">
                  {sessionStatus.scores.overall}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Policy:</span>
                <Badge variant="outline">
                  {sessionStatus.scores.policy_adherence}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Empathy:</span>
                <Badge variant="outline">
                  {sessionStatus.scores.empathy_index}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      )}

      {/* Session Complete Message */}
      {isSessionComplete && (
        <CardContent className="py-4 border-b">
          <Alert className={state.isPanelFrozen ? 'border-muted' : 'border-blue-200 bg-blue-50'}>
            <AlertDescription>
              <div className="text-center space-y-2">
                <div className="font-medium">
                  {state.phase === 'feedback' ? '📋 Reviewing Feedback' : '🎉 Session Complete!'}
                </div>
                <p className="text-sm">
                  {state.phase === 'feedback' 
                    ? 'Feedback is being displayed in the main chat area.'
                    : 'Check the main chat for detailed feedback.'}
                </p>
                {sessionStatus.scores && (
                  <Badge variant="secondary" className="text-base font-bold">
                    Final Score: {sessionStatus.scores.overall}%
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}

      {/* Training Loading Indicator */}
      {trainingIsLoading && (
        <CardContent className="py-4 border-b">
          <TrainingLoadingIndicator />
        </CardContent>
      )}

      {/* Input Area */}
      <div className="flex-1 flex flex-col">
        <TrainingInput
          onSendMessage={handleSendMessage}
          disabled={isSessionComplete || trainingIsLoading || state.isPanelFrozen}
          loading={trainingIsLoading}
          placeholder={
            state.isPanelFrozen
              ? "Panel is frozen - session complete or in feedback phase"
              : isSessionComplete 
              ? "Session complete - check main chat for feedback"
              : "Type your response to the guest..."
          }
        />
      </div>
    </Card>
  );
};
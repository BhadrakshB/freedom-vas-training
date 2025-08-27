"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FeedbackDisplay } from './FeedbackDisplay';
import { FeedbackOutput } from '../lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  Button,
  Skeleton
} from './ui';
import { ErrorAlert } from './ErrorAlert';
import { classifyError } from '../lib/error-handling';

interface FeedbackInterfaceProps {
  sessionId: string;
  onClose?: () => void;
  className?: string;
}

interface FeedbackState {
  loading: boolean;
  feedback: FeedbackOutput | null;
  error: string | null;
}

export const FeedbackInterface: React.FC<FeedbackInterfaceProps> = ({
  sessionId,
  onClose,
  className = ""
}) => {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    loading: true,
    feedback: null,
    error: null
  });
  const [exportLoading, setExportLoading] = useState<{
    session: boolean;
    feedback: boolean;
  }>({
    session: false,
    feedback: false
  });

  const fetchFeedback = useCallback(async () => {
    try {
      setFeedbackState(prev => ({ ...prev, loading: true, error: null }));

      // For now, we'll create a mock feedback API call
      // In the future, this would call an actual feedback generation endpoint
      const response = await fetch(`/api/training/feedback?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.statusText}`);
      }

      const feedback = await response.json();
      
      setFeedbackState({
        loading: false,
        feedback,
        error: null
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      const appError = classifyError(error);
      setFeedbackState({
        loading: false,
        feedback: null,
        error: appError.message
      });
    }
  }, [sessionId]);

  // Fetch feedback when component mounts
  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleExportSession = async () => {
    try {
      setExportLoading(prev => ({ ...prev, session: true }));
      const response = await fetch(`/api/training/export?sessionId=${sessionId}&type=session`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-session-${sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Failed to export session:', error);
      // Could add toast notification here
    } finally {
      setExportLoading(prev => ({ ...prev, session: false }));
    }
  };

  const handleExportFeedback = async () => {
    try {
      setExportLoading(prev => ({ ...prev, feedback: true }));
      const response = await fetch(`/api/training/export?sessionId=${sessionId}&type=feedback`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-feedback-${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Failed to export feedback:', error);
      // Could add toast notification here
    } finally {
      setExportLoading(prev => ({ ...prev, feedback: false }));
    }
  };

  if (feedbackState.loading) {
    return (
      <Card className={`min-h-96 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
          </div>
          <div className="mt-6 text-center">
            <CardTitle className="text-xl mb-2">Generating Your Feedback</CardTitle>
            <CardDescription className="max-w-md">
              Our AI is analyzing your training session performance and preparing detailed feedback with actionable recommendations.
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (feedbackState.error) {
    return (
      <Card className={`min-h-96 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <ErrorAlert
            error={{
              type: 'server',
              severity: 'high',
              message: 'Feedback Generation Failed',
              details: feedbackState.error,
              timestamp: new Date()
            }}
            onRetry={fetchFeedback}
            className="mb-6 max-w-md"
            showDetails={true}
          />
        </CardContent>
      </Card>
    );
  }

  if (!feedbackState.feedback) {
    return (
      <Card className={`min-h-96 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="text-muted-foreground text-4xl mb-4">📝</div>
          <CardTitle className="text-xl mb-2">No Feedback Available</CardTitle>
          <CardDescription className="text-center max-w-md">
            Feedback could not be generated for this session. Please try again or contact support.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Training Session Feedback</CardTitle>
            <CardDescription>Session ID: {sessionId}</CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleExportSession}
              variant="secondary"
              size="sm"
              disabled={exportLoading.session}
            >
              {exportLoading.session ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  Exporting...
                </div>
              ) : (
                "Export Session"
              )}
            </Button>
            <Button
              onClick={handleExportFeedback}
              variant="secondary"
              size="sm"
              disabled={exportLoading.feedback}
            >
              {exportLoading.feedback ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  Exporting...
                </div>
              ) : (
                "Export Feedback"
              )}
            </Button>
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                disabled={exportLoading.session || exportLoading.feedback}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Feedback Content */}
      <CardContent className="p-6">
        <FeedbackDisplay 
          feedback={feedbackState.feedback} 
          sessionId={sessionId}
          loading={feedbackState.loading}
        />
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="sticky bottom-0 bg-background border-t">
        <div className="flex items-center justify-between w-full">
          <CardDescription className="text-sm">
            Review your feedback and use the recommendations to improve your performance in future sessions.
          </CardDescription>
          <Button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700"
          >
            Start New Session
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
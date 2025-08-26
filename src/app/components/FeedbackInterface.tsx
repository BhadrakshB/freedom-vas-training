"use client";

import React, { useState, useEffect } from 'react';
import { FeedbackDisplay } from './FeedbackDisplay';
import { FeedbackOutput } from '../lib/agents/feedback-generator';

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

  // Fetch feedback when component mounts
  useEffect(() => {
    fetchFeedback();
  }, [sessionId]);

  const fetchFeedback = async () => {
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
      setFeedbackState({
        loading: false,
        feedback: null,
        error: error instanceof Error ? error.message : 'Failed to load feedback'
      });
    }
  };

  const handleExportSession = async () => {
    try {
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
      }
    } catch (error) {
      console.error('Failed to export session:', error);
    }
  };

  const handleExportFeedback = async () => {
    try {
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
      }
    } catch (error) {
      console.error('Failed to export feedback:', error);
    }
  };

  if (feedbackState.loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-96 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Feedback</h2>
        <p className="text-gray-600 text-center max-w-md">
          Our AI is analyzing your training session performance and preparing detailed feedback with actionable recommendations.
        </p>
      </div>
    );
  }

  if (feedbackState.error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-96 ${className}`}>
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Feedback Generation Failed</h2>
        <p className="text-gray-600 text-center max-w-md mb-4">{feedbackState.error}</p>
        <button
          onClick={fetchFeedback}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!feedbackState.feedback) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-96 ${className}`}>
        <div className="text-gray-400 text-4xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Available</h2>
        <p className="text-gray-600 text-center max-w-md">
          Feedback could not be generated for this session. Please try again or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Training Session Feedback</h1>
            <p className="text-sm text-gray-600">Session ID: {sessionId}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportSession}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Export Session
            </button>
            <button
              onClick={handleExportFeedback}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Export Feedback
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Content */}
      <div className="p-6">
        <FeedbackDisplay 
          feedback={feedbackState.feedback} 
          sessionId={sessionId}
        />
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Review your feedback and use the recommendations to improve your performance in future sessions.
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
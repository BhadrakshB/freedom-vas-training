"use client";

import React from 'react';

interface ProgressIndicatorProps {
  completedSteps: string[];
  requiredSteps: string[];
  completionPercentage: number;
  currentTurn: number;
  criticalErrors: string[];
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  completedSteps,
  requiredSteps,
  completionPercentage,
  currentTurn,
  criticalErrors,
  className = ""
}) => {
  const hasErrors = criticalErrors.length > 0;
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              hasErrors ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Turn Counter */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Turn:</span>
        <span className="font-medium">{currentTurn}</span>
      </div>

      {/* Steps Progress */}
      {requiredSteps.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Required Steps ({completedSteps.length}/{requiredSteps.length})
          </div>
          <div className="space-y-1">
            {requiredSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step);
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-2 text-xs p-2 rounded ${
                    isCompleted 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300'
                  }`}>
                    {isCompleted && (
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Critical Errors */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-800">
              Critical Errors ({criticalErrors.length})
            </span>
          </div>
          <div className="space-y-1">
            {criticalErrors.map((error, index) => (
              <div key={index} className="text-xs text-red-700 bg-red-100 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className={`text-center p-2 rounded-md text-sm ${
        completionPercentage === 100 
          ? 'bg-green-100 text-green-800'
          : hasErrors
          ? 'bg-red-100 text-red-800'
          : 'bg-blue-100 text-blue-800'
      }`}>
        {completionPercentage === 100 
          ? '✅ All steps completed!'
          : hasErrors
          ? '⚠️ Critical errors detected'
          : '🎯 Training in progress...'
        }
      </div>
    </div>
  );
};
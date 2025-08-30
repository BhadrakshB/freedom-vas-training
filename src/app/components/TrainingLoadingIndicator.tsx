"use client";

import React from 'react';
import { GraduationCapIcon, PlayIcon, CheckCircleIcon, ActivityIcon } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Progress } from '@/app/components/ui/progress';
import { useTrainingLoading, type TrainingLoadingType } from '@/app/contexts/TrainingLoadingContext';

interface TrainingLoadingIndicatorProps {
  type?: TrainingLoadingType;
  className?: string;
}

const TrainingLoadingIndicator: React.FC<TrainingLoadingIndicatorProps> = ({ 
  type: propType, 
  className 
}) => {
  const { isLoading, loadingMessage, state, showProgress } = useTrainingLoading();

  if (!isLoading) return null;

  // Use prop type if provided, otherwise use context type
  const loadingType = propType || state.type;

  const getLoadingIcon = (type?: TrainingLoadingType) => {
    switch (type) {
      case 'session-start':
        return <PlayIcon className="h-4 w-4" />;
      case 'message-send':
        return <GraduationCapIcon className="h-4 w-4" />;
      case 'status-check':
        return <ActivityIcon className="h-4 w-4" />;
      case 'session-complete':
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <GraduationCapIcon className="h-4 w-4" />;
    }
  };

  const getTypeSpecificMessage = (type?: TrainingLoadingType): string => {
    switch (type) {
      case 'session-start':
        return 'Initializing training environment...';
      case 'message-send':
        return 'Processing training interaction...';
      case 'status-check':
        return 'Evaluating performance...';
      case 'session-complete':
        return 'Finalizing training results...';
      default:
        return loadingMessage;
    }
  };

  const getLoadingColor = (type?: TrainingLoadingType) => {
    switch (type) {
      case 'session-start':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-800',
          icon: 'bg-green-500',
          text: 'text-green-700 dark:text-green-300',
          accent: 'bg-green-500',
          progressBg: 'bg-green-200 dark:bg-green-800'
        };
      case 'message-send':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/30',
          border: 'border-purple-200 dark:border-purple-800',
          icon: 'bg-purple-500',
          text: 'text-purple-700 dark:text-purple-300',
          accent: 'bg-purple-500',
          progressBg: 'bg-purple-200 dark:bg-purple-800'
        };
      case 'status-check':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-800',
          icon: 'bg-orange-500',
          text: 'text-orange-700 dark:text-orange-300',
          accent: 'bg-orange-500',
          progressBg: 'bg-orange-200 dark:bg-orange-800'
        };
      case 'session-complete':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          icon: 'bg-emerald-500',
          text: 'text-emerald-700 dark:text-emerald-300',
          accent: 'bg-emerald-500',
          progressBg: 'bg-emerald-200 dark:bg-emerald-800'
        };
      default:
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/30',
          border: 'border-indigo-200 dark:border-indigo-800',
          icon: 'bg-indigo-500',
          text: 'text-indigo-700 dark:text-indigo-300',
          accent: 'bg-indigo-500',
          progressBg: 'bg-indigo-200 dark:bg-indigo-800'
        };
    }
  };

  const colors = getLoadingColor(loadingType);
  const message = getTypeSpecificMessage(loadingType);

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg border",
      colors.bg,
      colors.border,
      className
    )}>
      {/* Animated icon */}
      <div className="flex-shrink-0">
        <div className="relative">
          {/* Rotating background ring for training */}
          <div className={cn(
            "absolute inset-0 rounded-full animate-spin",
            "border-2 border-transparent border-t-current opacity-30"
          )} style={{ color: colors.accent.replace('bg-', '') }} />
          {/* Icon container */}
          <div className={cn(
            "relative text-white rounded-full p-2",
            colors.icon,
            loadingType === 'session-start' ? 'animate-pulse' : 'animate-bounce'
          )}>
            {getLoadingIcon(loadingType)}
          </div>
        </div>
      </div>

      {/* Loading content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("text-sm font-medium", colors.text)}>
            {message}
          </span>
          {/* Training-specific animated indicator */}
          <div className="flex gap-1">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", colors.accent)} style={{ animationDelay: '0ms' }} />
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", colors.accent)} style={{ animationDelay: '200ms' }} />
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", colors.accent)} style={{ animationDelay: '400ms' }} />
          </div>
        </div>
        
        {/* Progress bar for session start */}
        {showProgress && typeof state.progress === 'number' && (
          <div className="space-y-1">
            <Progress 
              value={state.progress} 
              className={cn("h-2", colors.progressBg)}
            />
            <div className={cn("text-xs", colors.text)}>
              {Math.round(state.progress)}% complete
            </div>
          </div>
        )}

        {/* Loading wave animation for other types */}
        {!showProgress && (
          <div className={cn("w-full rounded-full h-1.5 overflow-hidden", colors.progressBg)}>
            <div 
              className={cn("h-full rounded-full", colors.accent)}
              style={{
                width: '40%',
                animation: 'training-wave 1.5s ease-in-out infinite'
              }} 
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes training-wave {
          0% { transform: translateX(-100%); width: 20%; }
          50% { transform: translateX(50%); width: 40%; }
          100% { transform: translateX(200%); width: 20%; }
        }
      `}</style>
    </div>
  );
};

export { TrainingLoadingIndicator };
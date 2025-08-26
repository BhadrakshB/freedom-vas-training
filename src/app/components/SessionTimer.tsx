"use client";

import React, { useState, useEffect } from 'react';

interface SessionTimerProps {
  startTime: Date;
  isActive: boolean;
  className?: string;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  startTime,
  isActive,
  className = ""
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const updateElapsedTime = () => {
      const now = new Date();
      const elapsed = now.getTime() - startTime.getTime();
      setElapsedTime(elapsed);
    };

    // Update immediately
    updateElapsedTime();

    // Set up interval only if session is active
    if (isActive) {
      const interval = setInterval(updateElapsedTime, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, isActive]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    const minutes = Math.floor(elapsedTime / (1000 * 60));
    
    if (minutes < 5) return 'text-green-600';
    if (minutes < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 ${getTimerColor()}`}>
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
        <span className="font-mono text-sm font-medium">
          {formatTime(elapsedTime)}
        </span>
      </div>
      
      {isActive && (
        <div className="flex items-center gap-1 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs">Active</span>
        </div>
      )}
      
      {!isActive && (
        <div className="flex items-center gap-1 text-gray-500">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-xs">Stopped</span>
        </div>
      )}
    </div>
  );
};
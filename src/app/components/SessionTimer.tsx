"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Badge } from '@/app/components/ui';
import { Clock } from 'lucide-react';

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

  const getTimerVariant = (): "default" | "secondary" | "destructive" => {
    const minutes = Math.floor(elapsedTime / (1000 * 60));
    
    if (minutes < 5) return 'default'; // Green-ish
    if (minutes < 10) return 'secondary'; // Yellow-ish
    return 'destructive'; // Red
  };

  return (
    <Card className={`w-fit ${className}`}>
      <CardContent className="flex items-center gap-2 p-3">
        <Badge variant={getTimerVariant()} className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span className="font-mono text-sm font-medium">
            {formatTime(elapsedTime)}
          </span>
        </Badge>
        
        <Badge 
          variant={isActive ? "default" : "secondary"}
          className={`flex items-center gap-1 ${isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs">
            {isActive ? 'Active' : 'Stopped'}
          </span>
        </Badge>
      </CardContent>
    </Card>
  );
};
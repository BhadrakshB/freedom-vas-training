"use client";

import React from 'react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { CheckIcon, AlertTriangleIcon } from 'lucide-react';

interface ProgressIndicatorProps {
  completedSteps: string[];
  requiredSteps: string[];
  completionPercentage: number;
  currentTurn: number;
  criticalErrors: string[];
  className?: string;
  loading?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  completedSteps,
  requiredSteps,
  completionPercentage,
  currentTurn,
  criticalErrors,
  className = "",
  loading = false
}) => {
  const hasErrors = criticalErrors.length > 0;
  
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Progress Bar Loading */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        {/* Turn Counter Loading */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>

        {/* Steps Loading */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md border bg-card">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Status Loading */}
        <div className="text-center">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Progress</span>
          <Badge variant="outline">{completionPercentage}%</Badge>
        </div>
        <Progress 
          value={completionPercentage} 
          className={hasErrors ? "[&>div]:bg-destructive" : "[&>div]:bg-green-500"}
        />
      </div>

      {/* Turn Counter */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Turn:</span>
        <Badge variant="secondary">{currentTurn}</Badge>
      </div>

      {/* Steps Progress */}
      {requiredSteps.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Required Steps</span>
            <Badge variant="outline">
              {completedSteps.length}/{requiredSteps.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {requiredSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step);
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-md border bg-card"
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckIcon className="h-3 w-3" />
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0">
                        {index + 1}
                      </Badge>
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Critical Errors */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Critical Errors ({criticalErrors.length})</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {criticalErrors.map((error, index) => (
                <div key={index} className="text-sm p-2 bg-destructive/10 rounded border">
                  {error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Summary */}
      <div className="text-center">
        <Badge 
          variant={
            completionPercentage === 100 
              ? "default" 
              : hasErrors
              ? "destructive"
              : "secondary"
          }
          className={
            completionPercentage === 100 
              ? "bg-green-500 hover:bg-green-600" 
              : ""
          }
        >
          {completionPercentage === 100 
            ? '✅ All steps completed!'
            : hasErrors
            ? '⚠️ Critical errors detected'
            : '🎯 Training in progress...'
          }
        </Badge>
      </div>
    </div>
  );
};
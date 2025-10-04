"use client";

import React from "react";
import { ErrorType } from "../lib/error-handling";

interface ErrorDisplayProps {
  errorMessage: string | null;
  errorType: ErrorType | null;
}

function isRetryableError(errorType: ErrorType): boolean {
  return ["network", "timeout", "unknown"].includes(errorType);
}

export function ErrorDisplay({ errorMessage, errorType }: ErrorDisplayProps) {
  if (!errorMessage || !errorType) return null;

  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case "network":
        return "🌐";
      case "timeout":
        return "⏱️";
      case "validation":
        return "⚠️";
      case "agent":
        return "🤖";
      case "session":
        return "📋";
      default:
        return "❌";
    }
  };

  return (
    <div className="px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-red-600 dark:text-red-400 font-medium">
          {getErrorIcon(errorType)}{" "}
          {errorType.charAt(0).toUpperCase() + errorType.slice(1)} Error
        </span>
        <span className="text-red-700 dark:text-red-300">{errorMessage}</span>
        {isRetryableError(errorType) && (
          <span className="text-red-600 dark:text-red-400 text-xs ml-auto">
            Retryable
          </span>
        )}
      </div>
    </div>
  );
}

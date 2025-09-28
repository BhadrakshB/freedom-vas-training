"use client";

import React from "react";
import { Button } from "./ui/button";

interface TrainingStartScreenProps {
  onStartTraining: () => void;
  onShowBulkCreation: () => void;
  isLoading: boolean;
}

export function TrainingStartScreen({
  onStartTraining,
  onShowBulkCreation,
  isLoading,
}: TrainingStartScreenProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Ready to Start Training?
        </h2>
        <p className="text-muted-foreground max-w-md">
          Customize your training using the panels on the right, or leave them
          blank for AI-generated content.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={onStartTraining} disabled={isLoading} size="lg">
            {isLoading
              ? "Starting Training..."
              : "Start Single Training Session"}
          </Button>
          <Button
            onClick={onShowBulkCreation}
            disabled={isLoading}
            variant="outline"
            size="lg"
          >
            Create Multiple Sessions
          </Button>
        </div>
      </div>
    </div>
  );
}

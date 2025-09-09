"use client";

import React from "react";
import { CheckCircle, AlertCircle, TrendingUp, Target, Lightbulb } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";
import { FeedbackSchema } from "../lib/agents/v2/graph_v2";

interface FeedbackPanelProps {
  feedback: FeedbackSchema;
  onStartNewSession: () => void;
  className?: string;
}

export function FeedbackPanel({
  feedback,
  onStartNewSession,
  className,
}: FeedbackPanelProps) {
  // Error handling for missing feedback data
  if (!feedback) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Feedback Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Training feedback could not be loaded. Please try starting a new session.
          </p>
          <Button onClick={onStartNewSession} className="w-full">
            Start New Training Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Overall Feedback Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            Training Session Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Overall Performance</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feedback.Overall_Feedback}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Messages Analysis */}
      {feedback.Critical_Messages && feedback.Critical_Messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Message Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback.Critical_Messages.map((message, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="text-xs">
                      Message #{message.index}
                    </Badge>
                  </div>
                  
                  <div className="text-sm bg-muted/30 p-3 rounded border-l-2 border-l-muted-foreground/20">
                    <p className="font-medium text-muted-foreground mb-1">Your message:</p>
                    <p>{message.Content}</p>
                  </div>

                  {message.Positive_Notes && message.Positive_Notes.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        What went well:
                      </h5>
                      <ul className="text-sm space-y-1">
                        {message.Positive_Notes.map((note, noteIndex) => (
                          <li key={noteIndex} className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                            <span className="text-muted-foreground">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {message.Constructive_Criticism && message.Constructive_Criticism.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Areas for improvement:
                      </h5>
                      <ul className="text-sm space-y-1">
                        {message.Constructive_Criticism.map((criticism, criticismIndex) => (
                          <li key={criticismIndex} className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                            <span className="text-muted-foreground">{criticism}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Improvements */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Strengths */}
        {feedback.Strengths && feedback.Strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feedback.Strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Areas for Improvement */}
        {feedback.Areas_For_Improvement && feedback.Areas_For_Improvement.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Target className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feedback.Areas_For_Improvement.map((area, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* General Suggestions */}
      {feedback.General_Suggestions && feedback.General_Suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              General Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.General_Suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* CTA Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Ready for Another Challenge?</h3>
              <p className="text-sm text-muted-foreground">
                Apply what you&apos;ve learned in a new training scenario
              </p>
            </div>
            <Button 
              onClick={onStartNewSession} 
              size="lg" 
              className="w-full md:w-auto px-8"
            >
              Start New Training Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
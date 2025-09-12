"use client";

import React from "react";
import { CheckCircle, AlertCircle, TrendingUp, Target, Lightbulb } from "lucide-react";
import { Button } from "./ui/button";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { Separator } from "./ui/separator";
import { FeedbackSchema } from "@/lib/agents/v2/graph_v2";

// Helper component for Areas for Improvement section
function AreasForImprovementSection({ areas }: { areas: string[] }) {
  const [showAllImprovements, setShowAllImprovements] = React.useState(false);
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
        <Target className="h-3 w-3" />
        Areas for Improvement
      </h4>
      <ul className="space-y-1">
        {(showAllImprovements ? areas : areas.slice(0, 2)).map((area, index) => (
          <li key={index} className="flex items-start gap-2 text-xs">
            <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{area}</span>
          </li>
        ))}
        {areas.length > 2 && (
          <li className="text-xs ml-5">
            <button
              onClick={() => setShowAllImprovements(!showAllImprovements)}
              className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              {showAllImprovements 
                ? "Show fewer areas..." 
                : `+${areas.length - 2} more areas...`
              }
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

// Helper component for General Suggestions section
function GeneralSuggestionsSection({ suggestions }: { suggestions: string[] }) {
  const [showAllSuggestions, setShowAllSuggestions] = React.useState(false);
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-xs flex items-center gap-1">
        <Lightbulb className="h-3 w-3" />
        Suggestions
      </h4>
      <ul className="space-y-1">
        {(showAllSuggestions ? suggestions : suggestions.slice(0, 2)).map((suggestion, index) => (
          <li key={index} className="flex items-start gap-2 text-xs">
            <Lightbulb className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{suggestion}</span>
          </li>
        ))}
        {suggestions.length > 2 && (
          <li className="text-xs ml-5">
            <button
              onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              {showAllSuggestions 
                ? "Show fewer suggestions..." 
                : `+${suggestions.length - 2} more suggestions...`
              }
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

interface FeedbackDisplayPanelProps {
  feedback: FeedbackSchema;
  onStartNewSession: () => void;
  defaultOpen?: boolean;
  className?: string;
}

export function FeedbackDisplayPanel({
  feedback,
  onStartNewSession,
  defaultOpen = false,
  className,
}: FeedbackDisplayPanelProps) {
  // Error handling for missing feedback data
  if (!feedback) {
    return (
      <CollapsiblePanel
        title="Feedback Unavailable"
        defaultOpen={defaultOpen}
        ctaText="Training feedback could not be loaded"
        className={className}
      >
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs">
            Training feedback could not be loaded. Please try starting a new session.
          </p>
          <Button onClick={onStartNewSession} size="sm" className="w-full">
            Start New Session
          </Button>
        </div>
      </CollapsiblePanel>
    );
  }

  return (
    <CollapsiblePanel
      title="Training Feedback"
      defaultOpen={defaultOpen}
      ctaText="View your training session feedback and performance analysis"
      className={className}
    >
      <div className="space-y-3 max-h-96 overflow-y-auto">
          {/* Overall Feedback Section */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-xs mb-2 text-primary">Overall Performance</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feedback.Overall_Feedback}
            </p>
          </div>

          {/* Strengths - Compact View */}
          {feedback.Strengths && feedback.Strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {feedback.Strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{strength}</span>
                  </li>
                ))}
                {/* {feedback.Strengths.length > 3 && (
                  <li className="text-xs text-muted-foreground/70 ml-5">
                    +{feedback.Strengths.length - 3} more strengths...
                  </li>
                )} */}
              </ul>
            </div>
          )}

          {/* Areas for Improvement - Compact View */}
          {feedback.Areas_For_Improvement && feedback.Areas_For_Improvement.length > 0 && (
            <AreasForImprovementSection areas={feedback.Areas_For_Improvement} />
          )}

          {/* Critical Messages - Compact View */}
          {feedback.Critical_Messages && feedback.Critical_Messages.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-xs flex items-center gap-1">
                <Target className="h-3 w-3" />
                Key Messages ({feedback.Critical_Messages.length})
              </h4>
              <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                {feedback.Critical_Messages.length} message{feedback.Critical_Messages.length !== 1 ? 's' : ''} analyzed with detailed feedback
              </div>
            </div>
          )}

          {/* General Suggestions - Compact View */}
          {feedback.General_Suggestions && feedback.General_Suggestions.length > 0 && (
            <GeneralSuggestionsSection suggestions={feedback.General_Suggestions} />
          )}
          <Separator className="my-3" />

          {/* CTA Section */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Ready for another challenge?
            </p>
            <Button 
              onClick={onStartNewSession} 
              size="sm" 
              className="w-full text-xs"
            >
              Start New Session
            </Button>
          </div>
      </div>
    </CollapsiblePanel>
  );
}
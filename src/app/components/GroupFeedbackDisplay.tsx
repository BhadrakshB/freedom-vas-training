"use client";

import React from "react";
import { Trophy, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface GroupFeedbackProps {
  groupFeedback: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    scores: {
      communication: number;
      empathy: number;
      accuracy: number;
      overall: number;
    };
    guest_prioritization?: {
      analysis: string;
      behavior_pattern: string;
      suggestions: string[];
      score: number;
    };
    responsiveness?: {
      analysis: string;
      avg_response_time_sec: number;
      variability: string;
      suggestions: string[];
      score: number;
    };
    session_breakdown?: Array<{
      thread_title: string;
      key_observations: string[];
      score: number;
      response_time_sec?: number;
      prioritization_note?: string;
    }>;
  };
}

// Helper function to get performance level text
const getPerformanceLevel = (score: number): string => {
  if (score >= 9) return "Excellent Performance";
  if (score >= 7.5) return "Strong Performance";
  if (score >= 6) return "Good Performance";
  if (score >= 4) return "Needs Improvement";
  return "Requires Attention";
};

// Helper function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 9) return "text-green-600 dark:text-green-400";
  if (score >= 7.5) return "text-blue-600 dark:text-blue-400";
  if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 4) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
};

// Helper function to calculate percentage for progress bar
const getPercentage = (score: number): number => {
  return (score / 10) * 100;
};

export function GroupFeedbackDisplay({ groupFeedback }: GroupFeedbackProps) {
  const overallScore = groupFeedback.scores.overall;
  const performanceLevel = getPerformanceLevel(overallScore);

  return (
    <div className="space-y-4">
      {/* Overall Score and Performance Breakdown - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall Score Card */}
        <Card className="border-2">
          <CardContent className="pt-8 pb-8 h-full flex items-center justify-center">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
              <div>
                <div
                  className={`text-6xl font-bold ${getScoreColor(
                    overallScore
                  )}`}
                >
                  {Math.round(overallScore * 10)}
                </div>
                <p className="text-base text-muted-foreground mt-2 font-medium">
                  Overall Score
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {performanceLevel}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Breakdown */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <h3 className="font-semibold text-base mb-4">
              Performance Breakdown
            </h3>
            <div className="space-y-4">
              {/* Communication */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Communication</span>
                  <span
                    className={`text-sm font-semibold ${getScoreColor(
                      groupFeedback.scores.communication
                    )}`}
                  >
                    {Math.round(groupFeedback.scores.communication * 10)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${getPercentage(
                        groupFeedback.scores.communication
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Empathy */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Empathy</span>
                  <span
                    className={`text-sm font-semibold ${getScoreColor(
                      groupFeedback.scores.empathy
                    )}`}
                  >
                    {Math.round(groupFeedback.scores.empathy * 10)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${getPercentage(groupFeedback.scores.empathy)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Accuracy */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Accuracy</span>
                  <span
                    className={`text-sm font-semibold ${getScoreColor(
                      groupFeedback.scores.accuracy
                    )}`}
                  >
                    {Math.round(groupFeedback.scores.accuracy * 10)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${getPercentage(groupFeedback.scores.accuracy)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Guest Prioritization (if available) */}
              {groupFeedback.guest_prioritization && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Guest Prioritization
                    </span>
                    <span
                      className={`text-sm font-semibold ${getScoreColor(
                        groupFeedback.guest_prioritization.score
                      )}`}
                    >
                      {Math.round(
                        groupFeedback.guest_prioritization.score * 10
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${getPercentage(
                          groupFeedback.guest_prioritization.score
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Responsiveness (if available) */}
              {groupFeedback.responsiveness && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Responsiveness</span>
                    <span
                      className={`text-sm font-semibold ${getScoreColor(
                        groupFeedback.responsiveness.score
                      )}`}
                    >
                      {Math.round(groupFeedback.responsiveness.score * 10)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${getPercentage(
                          groupFeedback.responsiveness.score
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What You Did Well and Areas for Improvement - Side by Side */}
      {((groupFeedback.strengths && groupFeedback.strengths.length > 0) ||
        (groupFeedback.weaknesses && groupFeedback.weaknesses.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* What You Did Well */}
          {groupFeedback.strengths && groupFeedback.strengths.length > 0 && (
            <Card className="border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-base text-green-900 dark:text-green-100">
                    What You Did Well
                  </h3>
                </div>
                <ul className="space-y-2">
                  {groupFeedback.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-green-900 dark:text-green-100">
                        {strength}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {groupFeedback.weaknesses && groupFeedback.weaknesses.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-semibold text-base text-amber-900 dark:text-amber-100">
                    Areas for Improvement
                  </h3>
                </div>
                <ul className="space-y-2">
                  {groupFeedback.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-amber-900 dark:text-amber-100">
                        {weakness}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* AI-Generated Insights */}
      {/* {groupFeedback.summary && groupFeedback.summary.trim() !== "" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base">AI-Generated Insights</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {groupFeedback.summary}
            </p>
          </CardContent>
        </Card>
      )} */}

      {/* Guest Prioritization Details */}
      {groupFeedback.guest_prioritization &&
        (groupFeedback.guest_prioritization.analysis?.trim() ||
          groupFeedback.guest_prioritization.behavior_pattern?.trim() ||
          groupFeedback.guest_prioritization.suggestions?.length > 0) && (
          <Card className="border-purple-200 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base text-purple-900 dark:text-purple-100">
                  Guest Prioritization Analysis
                </h3>
                <span
                  className={`text-sm font-semibold ${getScoreColor(
                    groupFeedback.guest_prioritization.score
                  )}`}
                >
                  Score:{" "}
                  {Math.round(groupFeedback.guest_prioritization.score * 10)}
                  /100
                </span>
              </div>

              <div className="space-y-3">
                {groupFeedback.guest_prioritization.analysis?.trim() && (
                  <div>
                    <h4 className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                      Analysis
                    </h4>
                    <p className="text-sm text-purple-900 dark:text-purple-100">
                      {groupFeedback.guest_prioritization.analysis}
                    </p>
                  </div>
                )}

                {groupFeedback.guest_prioritization.behavior_pattern?.trim() && (
                  <div>
                    <h4 className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                      Behavior Pattern
                    </h4>
                    <p className="text-sm text-purple-900 dark:text-purple-100 italic">
                      {groupFeedback.guest_prioritization.behavior_pattern}
                    </p>
                  </div>
                )}

                {groupFeedback.guest_prioritization.suggestions &&
                  groupFeedback.guest_prioritization.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
                        Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {groupFeedback.guest_prioritization.suggestions.map(
                          (suggestion, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="text-purple-600 dark:text-purple-400 mt-0.5">
                                →
                              </span>
                              <span className="text-purple-900 dark:text-purple-100">
                                {suggestion}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Responsiveness Details */}
      {groupFeedback.responsiveness &&
        (groupFeedback.responsiveness.analysis?.trim() ||
          groupFeedback.responsiveness.variability?.trim() ||
          groupFeedback.responsiveness.suggestions?.length > 0) && (
          <Card className="border-cyan-200 dark:border-cyan-900/30 bg-cyan-50/50 dark:bg-cyan-950/20">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base text-cyan-900 dark:text-cyan-100">
                  Responsiveness Analysis
                </h3>
                <span
                  className={`text-sm font-semibold ${getScoreColor(
                    groupFeedback.responsiveness.score
                  )}`}
                >
                  Score: {Math.round(groupFeedback.responsiveness.score * 10)}
                  /100
                </span>
              </div>

              <div className="space-y-3">
                {groupFeedback.responsiveness.analysis?.trim() && (
                  <div>
                    <h4 className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">
                      Analysis
                    </h4>
                    <p className="text-sm text-cyan-900 dark:text-cyan-100">
                      {groupFeedback.responsiveness.analysis}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">
                      Avg Response Time
                    </h4>
                    <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                      {groupFeedback.responsiveness.avg_response_time_sec.toFixed(
                        1
                      )}
                      s
                    </p>
                  </div>

                  {groupFeedback.responsiveness.variability?.trim() && (
                    <div>
                      <h4 className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">
                        Variability
                      </h4>
                      <p className="text-sm text-cyan-900 dark:text-cyan-100">
                        {groupFeedback.responsiveness.variability}
                      </p>
                    </div>
                  )}
                </div>

                {groupFeedback.responsiveness.suggestions &&
                  groupFeedback.responsiveness.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2">
                        Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {groupFeedback.responsiveness.suggestions.map(
                          (suggestion, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="text-cyan-600 dark:text-cyan-400 mt-0.5">
                                →
                              </span>
                              <span className="text-cyan-900 dark:text-cyan-100">
                                {suggestion}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Recommendations and Session Breakdown - Side by Side */}
      {((groupFeedback.recommendations &&
        groupFeedback.recommendations.length > 0) ||
        (groupFeedback.session_breakdown &&
          groupFeedback.session_breakdown.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recommendations */}
          {groupFeedback.recommendations &&
            groupFeedback.recommendations.length > 0 && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <h3 className="font-semibold text-base mb-3">
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {groupFeedback.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">→</span>
                        <span className="text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Session Breakdown */}
          {groupFeedback.session_breakdown &&
            groupFeedback.session_breakdown.length > 0 && (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <h3 className="font-semibold text-base mb-4">
                    Session Breakdown
                  </h3>
                  <div className="space-y-4">
                    {groupFeedback.session_breakdown.map((session, idx) => (
                      <div
                        key={idx}
                        className="border-l-4 border-primary/30 pl-4 py-2 bg-muted/30 rounded-r-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">
                            {session.thread_title}
                          </h4>
                          <span
                            className={`text-sm font-semibold ${getScoreColor(
                              session.score
                            )}`}
                          >
                            {Math.round(session.score * 10)}/100
                          </span>
                        </div>

                        {session.response_time_sec !== undefined && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Response Time:{" "}
                            {session.response_time_sec.toFixed(1)}s
                          </p>
                        )}

                        {session.prioritization_note && (
                          <p className="text-xs text-muted-foreground italic mb-2">
                            {session.prioritization_note}
                          </p>
                        )}

                        {session.key_observations.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">
                              Key Observations:
                            </h5>
                            <ul className="space-y-1">
                              {session.key_observations.map((obs, obsIdx) => (
                                <li
                                  key={obsIdx}
                                  className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                  <span className="mt-0.5">•</span>
                                  <span>{obs}</span>
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
        </div>
      )}
    </div>
  );
}

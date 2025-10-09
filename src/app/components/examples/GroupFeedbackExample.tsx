"use client";

import React from "react";
import { GroupFeedbackDisplay } from "../GroupFeedbackDisplay";

/**
 * Example usage of GroupFeedbackDisplay component
 *
 * This component displays comprehensive group feedback including:
 * - Overall score with trophy icon
 * - Performance breakdown with progress bars
 * - Strengths (what you did well)
 * - Weaknesses (areas for improvement)
 * - AI-generated insights
 * - Recommendations
 */

export function GroupFeedbackExample() {
  // Example group feedback data
  const exampleGroupFeedback = {
    summary:
      "Strong performance overall. Your empathetic approach helped de-escalate the situation effectively. Continue to focus on proactive problem-solving to reach excellence.",
    strengths: [
      "Responded promptly and professionally",
      "Showed empathy and understanding",
      "Provided clear, actionable solutions",
    ],
    weaknesses: [
      "Could proactively offer additional resources",
      "Consider anticipating follow-up questions",
    ],
    recommendations: [
      "Practice offering proactive solutions before guests ask",
      "Develop a checklist for common guest scenarios",
      "Review company policies on compensation and refunds",
    ],
    scores: {
      communication: 8.5,
      empathy: 9.0,
      accuracy: 8.5,
      overall: 8.7,
    },
    guest_prioritization: {
      analysis:
        "Excellent prioritization skills demonstrated across multiple scenarios",
      behavior_pattern:
        "Consistently addressed urgent matters first while maintaining communication with all guests",
      suggestions: [
        "Consider using priority flags for critical issues",
        "Develop a triage system for multiple concurrent requests",
      ],
      score: 8.5,
    },
    responsiveness: {
      analysis: "Response times were consistently good with minimal variation",
      avg_response_time_sec: 45.3,
      variability: "Low - responses were consistently timely",
      suggestions: [
        "Maintain current response time standards",
        "Consider templates for common scenarios to improve speed",
      ],
      score: 9.0,
    },
    session_breakdown: [
      {
        thread_title: "Booking Complaint - Room Issues",
        key_observations: [
          "Quick acknowledgment of issue",
          "Offered immediate solution",
          "Followed up appropriately",
        ],
        score: 8.5,
        response_time_sec: 42.0,
        prioritization_note: "Correctly identified as high priority",
      },
      {
        thread_title: "Overbooking Scenario",
        key_observations: [
          "Remained calm under pressure",
          "Provided multiple alternatives",
          "Documented everything properly",
        ],
        score: 9.0,
        response_time_sec: 38.5,
        prioritization_note: "Excellent handling of critical situation",
      },
    ],
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Group Feedback Example</h1>
      <GroupFeedbackDisplay groupFeedback={exampleGroupFeedback} />
    </div>
  );
}

"use client";

import React from 'react';
import { FeedbackOutput } from '../lib/agents/feedback-generator';

interface FeedbackDisplayProps {
  feedback: FeedbackOutput;
  sessionId: string;
  className?: string;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  feedback,
  sessionId,
  className = ""
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Performance Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Overall Performance</h2>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              feedback.overallPerformance.grade === 'A' ? 'bg-green-100 text-green-800' :
              feedback.overallPerformance.grade === 'B' ? 'bg-blue-100 text-blue-800' :
              feedback.overallPerformance.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
              feedback.overallPerformance.grade === 'D' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              Grade: {feedback.overallPerformance.grade}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {feedback.overallPerformance.score}%
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-4">{feedback.overallPerformance.summary}</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Key Strengths */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Key Strengths</h3>
            <ul className="space-y-1">
              {feedback.overallPerformance.keyStrengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Areas for Improvement</h3>
            <ul className="space-y-1">
              {feedback.overallPerformance.primaryAreasForImprovement.map((area, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 mr-2">→</span>
                  <span className="text-sm text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Session Completion Stats */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {feedback.overallPerformance.sessionCompletion.completionRate}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {feedback.overallPerformance.sessionCompletion.stepsCompleted}/
                {feedback.overallPerformance.sessionCompletion.totalSteps}
              </div>
              <div className="text-sm text-gray-600">Steps Completed</div>
            </div>
            <div>
              <div className={`text-lg font-semibold ${
                feedback.overallPerformance.sessionCompletion.criticalErrorCount === 0 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {feedback.overallPerformance.sessionCompletion.criticalErrorCount}
              </div>
              <div className="text-sm text-gray-600">Critical Errors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <DetailedAnalysisSection analysis={feedback.detailedAnalysis} />

      {/* SOP Citations Section */}
      <SOPCitationsSection citations={feedback.sopCitations} />

      {/* Actionable Recommendations Section */}
      <RecommendationsSection recommendations={feedback.actionableRecommendations} />

      {/* Resources Section */}
      <ResourcesSection resources={feedback.resources} />

      {/* Next Steps Section */}
      <NextStepsSection nextSteps={feedback.nextSteps} />
    </div>
  );
};

// Detailed Analysis Component
const DetailedAnalysisSection: React.FC<{ analysis: FeedbackOutput['detailedAnalysis'] }> = ({ analysis }) => {
  const dimensions = [
    { key: 'policyAdherence', label: 'Policy Adherence', icon: '📋' },
    { key: 'empathyIndex', label: 'Empathy Index', icon: '❤️' },
    { key: 'completeness', label: 'Completeness', icon: '✅' },
    { key: 'escalationJudgment', label: 'Escalation Judgment', icon: '⚡' },
    { key: 'timeEfficiency', label: 'Time Efficiency', icon: '⏱️' }
  ] as const;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Analysis</h2>
      
      <div className="space-y-4">
        {dimensions.map(({ key, label, icon }) => {
          const dimension = analysis[key];
          return (
            <div key={key} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{icon}</span>
                  <h3 className="font-medium text-gray-900">{label}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    dimension.trend === 'improving' ? 'bg-green-100 text-green-800' :
                    dimension.trend === 'declining' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {dimension.trend === 'improving' ? '↗️ Improving' :
                     dimension.trend === 'declining' ? '↘️ Declining' : '→ Stable'}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{dimension.score}%</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-700 mb-1">Strengths</h4>
                  <ul className="space-y-1">
                    {dimension.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-600">• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-orange-700 mb-1">Areas to Improve</h4>
                  <ul className="space-y-1">
                    {dimension.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-gray-600">• {weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {dimension.improvementOpportunities.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <h4 className="font-medium text-blue-900 mb-1">Improvement Opportunities</h4>
                  <ul className="space-y-1">
                    {dimension.improvementOpportunities.map((opportunity, index) => (
                      <li key={index} className="text-sm text-blue-800">• {opportunity}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// SOP Citations Component
const SOPCitationsSection: React.FC<{ citations: FeedbackOutput['sopCitations'] }> = ({ citations }) => {
  if (citations.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Relevant Policy Guidelines</h2>
      
      <div className="space-y-4">
        {citations.map((citation, index) => (
          <div key={index} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900">{citation.section}</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {citation.source}
              </span>
            </div>
            
            <div className="bg-gray-50 p-3 rounded mb-3">
              <p className="text-sm text-gray-700 italic">"{citation.content}"</p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Relevance: </span>
                <span className="text-gray-600">{citation.relevance}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Application: </span>
                <span className="text-gray-600">{citation.applicationExample}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recommendations Component
const RecommendationsSection: React.FC<{ recommendations: FeedbackOutput['actionableRecommendations'] }> = ({ recommendations }) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  const categoryIcons = {
    policy: '📋',
    communication: '💬',
    process: '⚙️',
    empathy: '❤️',
    efficiency: '⚡'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Actionable Recommendations</h2>
      
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-lg mr-2">{categoryIcons[rec.category]}</span>
                <h3 className="font-medium text-gray-900 capitalize">{rec.category}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityColors[rec.priority]}`}>
                {rec.priority.toUpperCase()} PRIORITY
              </span>
            </div>
            
            <p className="text-gray-700 mb-3">{rec.recommendation}</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Specific Actions:</h4>
                <ul className="space-y-1">
                  {rec.specificActions.map((action, actionIndex) => (
                    <li key={actionIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-3 bg-green-50 rounded">
                <h4 className="font-medium text-green-900 mb-1">Expected Outcome:</h4>
                <p className="text-sm text-green-800">{rec.expectedOutcome}</p>
              </div>
              
              {rec.relatedSOPs.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Related SOPs:</h4>
                  <div className="flex flex-wrap gap-1">
                    {rec.relatedSOPs.map((sop, sopIndex) => (
                      <span key={sopIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {sop}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Resources Component
const ResourcesSection: React.FC<{ resources: FeedbackOutput['resources'] }> = ({ resources }) => {
  const typeIcons = {
    training_material: '📚',
    sop_section: '📋',
    best_practice: '⭐',
    script_template: '📝'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended Resources</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {resources.map((resource, index) => (
          <div key={index} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-start mb-2">
              <span className="text-lg mr-2">{typeIcons[resource.type]}</span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{resource.title}</h3>
                <span className="text-xs text-gray-500 capitalize">
                  {resource.type.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{resource.description}</p>
            
            <div className="text-xs text-gray-600">
              <div className="mb-1">
                <span className="font-medium">Relevance: </span>
                {resource.relevance}
              </div>
              <div>
                <span className="font-medium">Source: </span>
                {resource.source}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Next Steps Component
const NextStepsSection: React.FC<{ nextSteps: string[] }> = ({ nextSteps }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
      
      <div className="space-y-3">
        {nextSteps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
              {index + 1}
            </div>
            <p className="text-gray-700">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
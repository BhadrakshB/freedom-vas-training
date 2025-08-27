"use client";

import React from 'react';
import { FeedbackOutput } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress, Tabs, TabsContent, TabsList, TabsTrigger, Separator, Alert, AlertDescription, Button, Skeleton } from './ui';

interface FeedbackDisplayProps {
  feedback: FeedbackOutput;
  sessionId: string;
  className?: string;
  loading?: boolean;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  feedback,
  className = "",
  loading = false
}) => {
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Overall Performance Loading */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-12" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start">
                    <Skeleton className="h-4 w-4 mr-2 mt-0.5" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start">
                    <Skeleton className="h-4 w-4 mr-2 mt-0.5" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center space-y-2">
                      <Skeleton className="h-8 w-12 mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Detailed Analysis Loading */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Skeleton className="h-5 w-5 mr-2" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations Loading */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-5 w-5 mr-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-px w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    {[1, 2].map((j) => (
                      <div key={j} className="flex items-start">
                        <Skeleton className="h-3 w-3 mr-2 mt-1" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Resources Loading */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <Skeleton className="h-5 w-5 mr-2" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-20 mt-1 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-px w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Performance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overall Performance</CardTitle>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={
                  feedback.overallPerformance.grade === 'A' ? 'default' :
                  feedback.overallPerformance.grade === 'B' ? 'secondary' :
                  feedback.overallPerformance.grade === 'C' ? 'outline' :
                  'destructive'
                }
                className={
                  feedback.overallPerformance.grade === 'A' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                  feedback.overallPerformance.grade === 'B' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                  feedback.overallPerformance.grade === 'C' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                  feedback.overallPerformance.grade === 'D' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' :
                  'bg-red-100 text-red-800 hover:bg-red-100'
                }
              >
                Grade: {feedback.overallPerformance.grade}
              </Badge>
              <div className="text-2xl font-bold">
                {feedback.overallPerformance.score}%
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{feedback.overallPerformance.summary}</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Key Strengths */}
            <div>
              <h3 className="font-medium mb-2">Key Strengths</h3>
              <ul className="space-y-1">
                {feedback.overallPerformance.keyStrengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm text-muted-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h3 className="font-medium mb-2">Areas for Improvement</h3>
              <ul className="space-y-1">
                {feedback.overallPerformance.primaryAreasForImprovement.map((area, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2">→</span>
                    <span className="text-sm text-muted-foreground">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Session Completion Stats */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {feedback.overallPerformance.sessionCompletion.completionRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </div>
                  <Progress 
                    value={feedback.overallPerformance.sessionCompletion.completionRate} 
                    className="h-2"
                  />
                </div>
                <div className="text-center space-y-2">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {feedback.overallPerformance.sessionCompletion.stepsCompleted}/
                      {feedback.overallPerformance.sessionCompletion.totalSteps}
                    </div>
                    <div className="text-sm text-muted-foreground">Steps Completed</div>
                  </div>
                  <Progress 
                    value={(feedback.overallPerformance.sessionCompletion.stepsCompleted / feedback.overallPerformance.sessionCompletion.totalSteps) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="text-center space-y-2">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      <Badge 
                        variant={feedback.overallPerformance.sessionCompletion.criticalErrorCount === 0 ? 'default' : 'destructive'}
                        className={feedback.overallPerformance.sessionCompletion.criticalErrorCount === 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                      >
                        {feedback.overallPerformance.sessionCompletion.criticalErrorCount}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">Critical Errors</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

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
    <Card>
      <CardHeader>
        <CardTitle>Detailed Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dimensions.map(({ key, label, icon }) => {
                const dimension = analysis[key];
                return (
                  <Card key={key}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{icon}</span>
                          <h3 className="font-medium">{label}</h3>
                        </div>
                        <Badge 
                          variant={
                            dimension.trend === 'improving' ? 'default' :
                            dimension.trend === 'declining' ? 'destructive' :
                            'secondary'
                          }
                          className={
                            dimension.trend === 'improving' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                            dimension.trend === 'declining' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-100'
                          }
                        >
                          {dimension.trend === 'improving' ? '↗️' :
                           dimension.trend === 'declining' ? '↘️' : '→'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">{dimension.score}%</span>
                        </div>
                        <Progress value={dimension.score} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="dimensions" className="space-y-4">
            {dimensions.map(({ key, label, icon }) => {
              const dimension = analysis[key];
              return (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{icon}</span>
                        <CardTitle className="text-lg">{label}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            dimension.trend === 'improving' ? 'default' :
                            dimension.trend === 'declining' ? 'destructive' :
                            'secondary'
                          }
                          className={
                            dimension.trend === 'improving' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                            dimension.trend === 'declining' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-100'
                          }
                        >
                          {dimension.trend === 'improving' ? '↗️ Improving' :
                           dimension.trend === 'declining' ? '↘️ Declining' : '→ Stable'}
                        </Badge>
                        <div className="text-2xl font-bold">{dimension.score}%</div>
                      </div>
                    </div>
                    <Progress value={dimension.score} className="h-2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="bg-green-50/50">
                        <CardContent className="pt-4">
                          <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {dimension.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-green-500 mr-2 mt-0.5">✓</span>
                                <span className="text-muted-foreground">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-orange-50/50">
                        <CardContent className="pt-4">
                          <h4 className="font-medium text-orange-700 mb-2">Areas to Improve</h4>
                          <ul className="space-y-1">
                            {dimension.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <span className="text-orange-500 mr-2 mt-0.5">→</span>
                                <span className="text-muted-foreground">{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {dimension.improvementOpportunities.length > 0 && (
                      <>
                        <Separator />
                        <Card className="bg-blue-50/50">
                          <CardContent className="pt-4">
                            <h4 className="font-medium text-blue-700 mb-2">Improvement Opportunities</h4>
                            <ul className="space-y-1">
                              {dimension.improvementOpportunities.map((opportunity, index) => (
                                <li key={index} className="flex items-start text-sm">
                                  <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                                  <span className="text-blue-800">{opportunity}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="grid gap-4">
              {dimensions.map(({ key, label, icon }) => {
                const dimension = analysis[key];
                return (
                  <Card key={key}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{icon}</span>
                          <div>
                            <h3 className="font-medium">{label}</h3>
                            <p className="text-sm text-muted-foreground">Current Score: {dimension.score}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              dimension.trend === 'improving' ? 'default' :
                              dimension.trend === 'declining' ? 'destructive' :
                              'secondary'
                            }
                            className={
                              dimension.trend === 'improving' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                              dimension.trend === 'declining' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                              'bg-gray-100 text-gray-800 hover:bg-gray-100'
                            }
                          >
                            {dimension.trend === 'improving' ? '↗️ Improving' :
                             dimension.trend === 'declining' ? '↘️ Declining' : '→ Stable'}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={dimension.score} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// SOP Citations Component
const SOPCitationsSection: React.FC<{ citations: FeedbackOutput['sopCitations'] }> = ({ citations }) => {
  if (citations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relevant Policy Guidelines</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {citations.map((citation, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{citation.section}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {citation.source}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert className="bg-muted/50">
                  <AlertDescription className="italic">
                    &ldquo;{citation.content}&rdquo;
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Relevance: </span>
                    <span className="text-muted-foreground">{citation.relevance}</span>
                  </div>
                  <div>
                    <span className="font-medium">Application: </span>
                    <span className="text-muted-foreground">{citation.applicationExample}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Recommendations Component
const RecommendationsSection: React.FC<{ recommendations: FeedbackOutput['actionableRecommendations'] }> = ({ recommendations }) => {
  const categoryIcons = {
    policy: '📋',
    communication: '💬',
    process: '⚙️',
    empathy: '❤️',
    efficiency: '⚡'
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'low': return 'bg-green-100 text-green-800 hover:bg-green-100';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actionable Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{categoryIcons[rec.category]}</span>
                  <CardTitle className="text-lg capitalize">{rec.category}</CardTitle>
                </div>
                <Badge 
                  variant={getPriorityVariant(rec.priority)}
                  className={getPriorityColors(rec.priority)}
                >
                  {rec.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{rec.recommendation}</p>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Specific Actions:</h4>
                <ul className="space-y-1">
                  {rec.specificActions.map((action, actionIndex) => (
                    <li key={actionIndex} className="text-sm text-muted-foreground flex items-start">
                      <span className="text-primary mr-2 mt-0.5">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Expected Outcome:</h4>
                    <p className="text-sm text-green-800">{rec.expectedOutcome}</p>
                  </div>
                </AlertDescription>
              </Alert>
              
              {rec.relatedSOPs.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Related SOPs:</h4>
                    <div className="flex flex-wrap gap-1">
                      {rec.relatedSOPs.map((sop, sopIndex) => (
                        <Badge key={sopIndex} variant="secondary" className="text-xs">
                          {sop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Recommended Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {resources.map((resource, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <span className="text-lg mr-2">{typeIcons[resource.type]}</span>
                    <div className="flex-1">
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {resource.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{resource.description}</p>
                
                <Separator />
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium">Relevance: </span>
                    <span className="text-muted-foreground">{resource.relevance}</span>
                  </div>
                  <div>
                    <span className="font-medium">Source: </span>
                    <span className="text-muted-foreground">{resource.source}</span>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Access Resource
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Next Steps Component
const NextStepsSection: React.FC<{ nextSteps: string[] }> = ({ nextSteps }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nextSteps.map((step, index) => (
            <div key={index} className="flex items-start">
              <Badge variant="outline" className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 p-0">
                {index + 1}
              </Badge>
              <p className="text-foreground">{step}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
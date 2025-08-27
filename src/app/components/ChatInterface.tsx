'use client';

import React, { useState, useRef, useEffect } from 'react';
// Optimized imports - only import what's needed
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ErrorAlert } from './ErrorAlert';
import { classifyError } from '../lib/error-handling';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: string[];
  performanceInsights?: PerformanceInsights;
}

interface PerformanceInsights {
  totalSessions: number;
  averageScore: number;
  strongestSkill: string;
  improvementArea: string;
  recentTrend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

interface ChatInterfaceProps {
  userId?: string;
  className?: string;
  onClose?: () => void;
}

export default function ChatInterface({ 
  userId = 'anonymous', 
  className = '',
  onClose 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you with your training progress and answer any questions you have. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<'general' | 'performance_review' | 'training_advice' | 'session_analysis'>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          userId,
          context,
          conversationHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestedActions: data.suggestedActions,
        performanceInsights: data.performanceInsights
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const appError = classifyError(error);
      setError(appError.message);
      
      // Also add error message to chat for user visibility
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInputMessage(action);
    inputRef.current?.focus();
  };



  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↗️';
      case 'declining': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div>
          <h2 className="text-lg font-semibold">Training Assistant</h2>
          <p className="text-sm text-muted-foreground">Ask me about your progress, get advice, or just chat!</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Context Selector */}
          <Select value={context} onValueChange={(value) => setContext(value as 'general' | 'performance_review' | 'training_advice' | 'session_analysis')}>
            <SelectTrigger className="w-48 text-sm">
              <SelectValue placeholder="Select context" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Chat</SelectItem>
              <SelectItem value="performance_review">Performance Review</SelectItem>
              <SelectItem value="training_advice">Training Advice</SelectItem>
              <SelectItem value="session_analysis">Session Analysis</SelectItem>
            </SelectContent>
          </Select>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close chat"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Error Display */}
          {error && (
            <ErrorAlert
              error={error}
              onRetry={() => setError(null)}
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              
              <Card className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-card'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={message.role === 'user' ? 'secondary' : 'default'} className="text-xs">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </Badge>
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
              
                  {/* Performance Insights */}
                  {message.performanceInsights && (
                    <Alert className="mt-3" role="region" aria-labelledby="performance-insights-title">
                      <span className="text-lg" aria-hidden="true">📊</span>
                      <AlertDescription>
                        <Card className="border-0 shadow-none bg-transparent p-0">
                          <CardHeader className="p-0 pb-3">
                            <CardTitle id="performance-insights-title" className="text-base font-medium">
                              Your Performance Overview
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0 space-y-4">
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Total Sessions</div>
                                <Badge variant="secondary" className="text-sm font-medium">
                                  {message.performanceInsights.totalSessions}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Average Score</div>
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={message.performanceInsights.averageScore} 
                                    className="h-2 flex-1"
                                    aria-label={`Average score: ${message.performanceInsights.averageScore} out of 100`}
                                  />
                                  <Badge variant="outline" className="text-xs">
                                    {message.performanceInsights.averageScore}%
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Skills Assessment */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">Strongest Skill</div>
                                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                    ✓ {message.performanceInsights.strongestSkill}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-right">
                                  <div className="text-xs text-muted-foreground">Needs Improvement</div>
                                  <Badge variant="outline" className="border-orange-200 text-orange-800">
                                    ⚠ {message.performanceInsights.improvementArea}
                                  </Badge>
                                </div>
                              </div>

                              {/* Trend Indicator */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Recent Trend:</span>
                                <Badge 
                                  variant={message.performanceInsights.recentTrend === 'improving' ? 'default' : 'outline'}
                                  className={`text-xs ${
                                    message.performanceInsights.recentTrend === 'improving' 
                                      ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' 
                                      : message.performanceInsights.recentTrend === 'declining'
                                      ? 'border-red-200 text-red-800'
                                      : 'border-blue-200 text-blue-800'
                                  }`}
                                  aria-label={`Performance trend: ${message.performanceInsights.recentTrend}`}
                                >
                                  {getTrendIcon(message.performanceInsights.recentTrend)} {message.performanceInsights.recentTrend}
                                </Badge>
                              </div>
                            </div>

                            {/* Recommendations */}
                            {message.performanceInsights.recommendations.length > 0 && (
                              <>
                                <Separator />
                                <div className="space-y-2">
                                  <div className="text-xs text-muted-foreground font-medium">
                                    Personalized Recommendations
                                  </div>
                                  <div className="space-y-2">
                                    {message.performanceInsights.recommendations.map((rec, index) => (
                                      <Alert key={index} className="py-2 px-3 bg-blue-50 border-blue-200">
                                        <AlertDescription className="text-sm flex items-start gap-2">
                                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 border-blue-300 shrink-0">
                                            {index + 1}
                                          </Badge>
                                          <span className="flex-1">{rec}</span>
                                        </AlertDescription>
                                      </Alert>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Suggested Actions */}
                  {message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-muted-foreground">Suggested follow-ups:</div>
                      <div className="space-y-1">
                        {message.suggestedActions.map((action, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuggestedAction(action)}
                            className="w-full justify-start text-left h-auto p-2 text-sm font-normal"
                          >
                            <span className="mr-1">💡</span>
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {message.role === 'user' && (
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                    U
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  AI
                </AvatarFallback>
              </Avatar>
              
              <Card className="max-w-[80%] bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-xs">
                      Assistant
                    </Badge>
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about your training progress, get advice, or just chat..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4"
          >
            Send
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
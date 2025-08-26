'use client';

import React, { useState, useRef, useEffect } from 'react';

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInputMessage(action);
    inputRef.current?.focus();
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↗️';
      case 'declining': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Training Assistant</h2>
          <p className="text-sm text-gray-600">Ask me about your progress, get advice, or just chat!</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Context Selector */}
          <select
            value={context}
            onChange={(e) => setContext(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">General Chat</option>
            <option value="performance_review">Performance Review</option>
            <option value="training_advice">Training Advice</option>
            <option value="session_analysis">Session Analysis</option>
          </select>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Performance Insights */}
              {message.performanceInsights && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">📊 Your Performance Overview</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Total Sessions:</span>
                      <span className="ml-1 font-medium">{message.performanceInsights.totalSessions}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Average Score:</span>
                      <span className="ml-1 font-medium">{message.performanceInsights.averageScore}/100</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Strongest Skill:</span>
                      <span className="ml-1 font-medium text-green-600">{message.performanceInsights.strongestSkill}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Improvement Area:</span>
                      <span className="ml-1 font-medium text-orange-600">{message.performanceInsights.improvementArea}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600">Recent Trend:</span>
                    <span className={`ml-1 font-medium ${getTrendColor(message.performanceInsights.recentTrend)}`}>
                      {getTrendIcon(message.performanceInsights.recentTrend)} {message.performanceInsights.recentTrend}
                    </span>
                  </div>
                  {message.performanceInsights.recommendations.length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">Recommendations:</span>
                      <ul className="mt-1 text-sm text-gray-700">
                        {message.performanceInsights.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Actions */}
              {message.suggestedActions && message.suggestedActions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs text-gray-500 mb-1">Suggested follow-ups:</div>
                  {message.suggestedActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedAction(action)}
                      className="block w-full text-left text-sm bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors"
                    >
                      💡 {action}
                    </button>
                  ))}
                </div>
              )}

              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your training progress, get advice, or just chat..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
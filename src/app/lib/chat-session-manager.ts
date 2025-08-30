/**
 * ChatSessionManager - Independent chat session handling
 * 
 * This manager handles chat sessions completely independently from training sessions.
 * It manages conversation history, message sending, and chat-specific state without
 * any dependencies on training functionality.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: string[];
  performanceInsights?: PerformanceInsights;
}

export interface PerformanceInsights {
  totalSessions: number;
  averageScore: number;
  strongestSkill: string;
  improvementArea: string;
  recentTrend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

export interface ChatSessionState {
  conversationHistory: ChatMessage[];
  isActive: boolean;
  messageCount: number;
  sessionStartTime?: Date;
  lastMessageTime?: Date;
}

export interface ChatSessionManager {
  // Session state
  getSessionState(): ChatSessionState;
  
  // Message management
  addMessage(message: ChatMessage): void;
  clearHistory(): void;
  getConversationHistory(): ChatMessage[];
  
  // Session operations
  sendMessage(message: string, context?: string, userId?: string): Promise<ChatMessage>;
  
  // Session lifecycle
  startSession(): void;
  endSession(): void;
  isSessionActive(): boolean;
}

class ChatSessionManagerImpl implements ChatSessionManager {
  private state: ChatSessionState = {
    conversationHistory: [],
    isActive: false,
    messageCount: 0,
  };

  getSessionState(): ChatSessionState {
    return { ...this.state };
  }

  addMessage(message: ChatMessage): void {
    this.state.conversationHistory.push(message);
    this.state.messageCount++;
    this.state.lastMessageTime = new Date();
  }

  clearHistory(): void {
    this.state.conversationHistory = [];
    this.state.messageCount = 0;
    this.state.lastMessageTime = undefined;
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.state.conversationHistory];
  }

  async sendMessage(
    message: string, 
    context: string = 'general', 
    userId: string = 'anonymous'
  ): Promise<ChatMessage> {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    // Add user message to history
    this.addMessage(userMessage);

    try {
      // Send to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          userId,
          context,
          conversationHistory: this.state.conversationHistory.slice(-10).map(msg => ({
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

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestedActions: data.suggestedActions,
        performanceInsights: data.performanceInsights
      };

      // Add assistant message to history
      this.addMessage(assistantMessage);

      return assistantMessage;
    } catch (error) {
      // Create error message for user visibility
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date()
      };

      this.addMessage(errorMessage);
      throw error;
    }
  }

  startSession(): void {
    this.state.isActive = true;
    this.state.sessionStartTime = new Date();
    
    // Add welcome message if no conversation history
    if (this.state.conversationHistory.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm here to help you with your training progress and answer any questions you have. How can I assist you today?",
        timestamp: new Date()
      };
      this.addMessage(welcomeMessage);
    }
  }

  endSession(): void {
    this.state.isActive = false;
  }

  isSessionActive(): boolean {
    return this.state.isActive;
  }
}

// Factory function to create a new chat session manager
export function createChatSessionManager(): ChatSessionManager {
  return new ChatSessionManagerImpl();
}

// Singleton instance for global use (optional)
let globalChatSessionManager: ChatSessionManager | null = null;

export function getChatSessionManager(): ChatSessionManager {
  if (!globalChatSessionManager) {
    globalChatSessionManager = createChatSessionManager();
  }
  return globalChatSessionManager;
}
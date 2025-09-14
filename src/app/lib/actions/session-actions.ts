'use server';

import { db } from '../db';
import { thread, message } from '../db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { getOrCreateUserByFirebaseUid } from '../db/actions/user-actions';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';

export interface SessionDetails {
  thread: {
    id: string;
    title: string;
    status: 'active' | 'completed' | 'paused';
    scenario: any;
    persona: any;
    score: any;
    feedback: any;
    startedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  messages: BaseMessage[];
  messageCount: number;
}

// Fetch complete session details including all messages
export async function getSessionDetails(
  threadId: string, 
  firebaseUid?: string
): Promise<{ success: boolean; data?: SessionDetails; error?: string }> {
  try {
    console.log('getSessionDetails: Fetching session for thread:', threadId);

    // Fetch the thread
    const [threadRecord] = await db
      .select()
      .from(thread)
      .where(and(
        eq(thread.id, threadId),
        isNull(thread.deletedAt)
      ))
      .limit(1);

    if (!threadRecord) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    // If firebaseUid is provided, verify ownership
    if (firebaseUid) {
      const userResult = await getOrCreateUserByFirebaseUid(firebaseUid);
      if (!userResult || threadRecord.userId !== userResult.user.id) {
        return {
          success: false,
          error: 'Unauthorized access to session'
        };
      }
    }

    // Fetch all messages for this thread
    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, threadId))
      .orderBy(asc(message.createdAt));

    // Convert database messages to LangChain BaseMessage format
    const langchainMessages: BaseMessage[] = messages.map(msg => {
      const content = msg.parts && Array.isArray(msg.parts) 
        ? msg.parts.map((part: any) => part.text || '').join('\n')
        : '';
      
      if (msg.role === 'AI') {
        return new AIMessage(content);
      } else {
        return new HumanMessage(content);
      }
    });

    const sessionDetails: SessionDetails = {
      thread: {
        id: threadRecord.id,
        title: threadRecord.title,
        status: threadRecord.status as 'active' | 'completed' | 'paused',
        scenario: threadRecord.scenario,
        persona: threadRecord.persona,
        score: threadRecord.score,
        feedback: threadRecord.feedback,
        startedAt: threadRecord.startedAt,
        completedAt: threadRecord.completedAt,
        createdAt: threadRecord.createdAt,
        updatedAt: threadRecord.updatedAt
      },
      messages: langchainMessages,
      messageCount: messages.length
    };

    return {
      success: true,
      data: sessionDetails
    };

  } catch (error) {
    console.error('getSessionDetails: Error fetching session:', error);
    return {
      success: false,
      error: 'Failed to fetch session details'
    };
  }
}

// Get session summary without messages (lighter weight)
export async function getSessionSummary(
  threadId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const [threadRecord] = await db
      .select()
      .from(thread)
      .where(and(
        eq(thread.id, threadId),
        isNull(thread.deletedAt)
      ))
      .limit(1);

    if (!threadRecord) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    // Get message count
    const messages = await db
      .select({ id: message.id })
      .from(message)
      .where(eq(message.chatId, threadId));

    return {
      success: true,
      data: {
        ...threadRecord,
        messageCount: messages.length
      }
    };

  } catch (error) {
    console.error('getSessionSummary: Error:', error);
    return {
      success: false,
      error: 'Failed to fetch session summary'
    };
  }
}
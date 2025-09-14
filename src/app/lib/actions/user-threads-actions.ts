'use server';

import { db } from '../db/index';
import { thread, user, userAuth } from '../db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { Thread } from '../db/schema';

export interface UserThread extends Thread {
  isActive?: boolean;
  messageCount?: number;
  lastActivity?: Date;
}

export interface UserThreadsResponse {
  success: boolean;
  threads: UserThread[];
  totalCount: number;
  activeCount: number;
  completedCount: number;
  error?: string;
}

// Get all threads for a user by their Firebase UID
export async function getUserThreadsByFirebaseUid(firebaseUid: string): Promise<UserThreadsResponse> {
  try {
    console.log('getUserThreadsByFirebaseUid: Fetching threads for Firebase UID:', firebaseUid);

    // First, find the user's internal ID by their Firebase UID
    const userRecord = await db
      .select({ userId: userAuth.userId })
      .from(userAuth)
      .where(eq(userAuth.providerUserId, firebaseUid))
      .limit(1);

    if (userRecord.length === 0) {
      console.log('getUserThreadsByFirebaseUid: No user found for Firebase UID');
      return {
        success: true,
        threads: [],
        totalCount: 0,
        activeCount: 0,
        completedCount: 0
      };
    }

    const userId = userRecord[0].userId;
    console.log('getUserThreadsByFirebaseUid: Found internal user ID:', userId);

    // Get all threads for this user
    const userThreads = await db
      .select()
      .from(thread)
      .where(and(
        eq(thread.userId, userId),
        isNull(thread.deletedAt)
      ))
      .orderBy(desc(thread.updatedAt));

    console.log('getUserThreadsByFirebaseUid: Found threads count:', userThreads.length);

    // Calculate statistics
    const totalCount = userThreads.length;
    const activeCount = userThreads.filter(t => t.status === 'active').length;
    const completedCount = userThreads.filter(t => t.status === 'completed').length;

    // Transform threads to include additional metadata
    const threadsWithMetadata: UserThread[] = userThreads.map(t => ({
      ...t,
      isActive: t.status === 'active',
      lastActivity: t.updatedAt
    }));

    return {
      success: true,
      threads: threadsWithMetadata,
      totalCount,
      activeCount,
      completedCount
    };

  } catch (error) {
    console.error('getUserThreadsByFirebaseUid: Error fetching user threads:', error);
    return {
      success: false,
      threads: [],
      totalCount: 0,
      activeCount: 0,
      completedCount: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch user threads'
    };
  }
}

// Get recent threads (last 10)
export async function getRecentUserThreads(firebaseUid: string): Promise<UserThreadsResponse> {
  try {
    const result = await getUserThreadsByFirebaseUid(firebaseUid);
    
    if (!result.success) {
      return result;
    }

    return {
      ...result,
      threads: result.threads.slice(0, 10) // Get only the 10 most recent
    };
  } catch (error) {
    console.error('getRecentUserThreads: Error:', error);
    return {
      success: false,
      threads: [],
      totalCount: 0,
      activeCount: 0,
      completedCount: 0,
      error: 'Failed to fetch recent threads'
    };
  }
}

// Get threads by status
export async function getUserThreadsByStatus(
  firebaseUid: string, 
  status: 'active' | 'completed' | 'paused'
): Promise<UserThreadsResponse> {
  try {
    const result = await getUserThreadsByFirebaseUid(firebaseUid);
    
    if (!result.success) {
      return result;
    }

    const filteredThreads = result.threads.filter(t => t.status === status);

    return {
      ...result,
      threads: filteredThreads,
      totalCount: filteredThreads.length
    };
  } catch (error) {
    console.error('getUserThreadsByStatus: Error:', error);
    return {
      success: false,
      threads: [],
      totalCount: 0,
      activeCount: 0,
      completedCount: 0,
      error: 'Failed to fetch threads by status'
    };
  }
}
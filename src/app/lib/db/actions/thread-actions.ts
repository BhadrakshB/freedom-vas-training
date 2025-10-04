'use server';

import { db } from '../index';
import { thread } from '../schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { Thread } from '../schema';

// CREATE
export async function createThread(data: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>) {
  const [result] = await db.insert(thread).values(data).returning();
  return result;
}

// READ (fetch all threads)
export async function getThreads() {
  return await db.select().from(thread).where(isNull(thread.deletedAt)).orderBy(desc(thread.createdAt));
}

// READ (fetch thread by ID)
export async function getThreadById(id: string) {
  const [result] = await db.select().from(thread)
    .where(and(eq(thread.id, id), isNull(thread.deletedAt)))
    .limit(1);
  return result;
}

// READ (fetch threads by user ID)
export async function getThreadsByUserId(userId: string) {
  return await db.select().from(thread)
    .where(and(eq(thread.userId, userId), isNull(thread.deletedAt)))
    .orderBy(desc(thread.createdAt));
}

// READ (fetch threads by status)
export async function getThreadsByStatus(status: 'active' | 'completed' | 'paused') {
  return await db.select().from(thread)
    .where(and(eq(thread.status, status), isNull(thread.deletedAt)))
    .orderBy(desc(thread.createdAt));
}

// READ (fetch threads by user and status)
export async function getThreadsByUserAndStatus(userId: string, status: 'active' | 'completed' | 'paused') {
  return await db.select().from(thread)
    .where(and(
      eq(thread.userId, userId),
      eq(thread.status, status),
      isNull(thread.deletedAt)
    ))
    .orderBy(desc(thread.createdAt));
}

// READ (fetch threads by group ID)
export async function getThreadsByGroupId(groupId: string) {
  return await db.select().from(thread)
    .where(and(
      eq(thread.groupId, groupId),
      isNull(thread.deletedAt)
    ))
    .orderBy(desc(thread.createdAt));
}

// READ (fetch public threads)
export async function getPublicThreads() {
  return await db.select().from(thread)
    .where(and(
      eq(thread.visibility, 'public'),
      isNull(thread.deletedAt)
    ))
    .orderBy(desc(thread.createdAt));
}

// READ (fetch active training sessions for user)
export async function getActiveTrainingSessions(userId: string) {
  return await db.select().from(thread)
    .where(and(
      eq(thread.userId, userId),
      eq(thread.status, 'active'),
      isNull(thread.deletedAt)
    ))
    .orderBy(desc(thread.startedAt));
}

// UPDATE
export async function updateThread(id: string, data: Partial<Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>>) {
  const [result] = await db.update(thread)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(thread.id, id))
    .returning();
  return result;
}

// UPDATE (complete training session)
export async function completeTrainingSession(id: string, score?: any, feedback?: any) {
  const [result] = await db.update(thread)
    .set({
      status: 'completed',
      completedAt: new Date(),
      score,
      feedback,
      updatedAt: new Date()
    })
    .where(eq(thread.id, id))
    .returning();
  return result;
}

// UPDATE (pause training session)
export async function pauseTrainingSession(id: string) {
  const [result] = await db.update(thread)
    .set({
      status: 'paused',
      updatedAt: new Date()
    })
    .where(eq(thread.id, id))
    .returning();
  return result;
}

// UPDATE (resume training session)
export async function resumeTrainingSession(id: string) {
  const [result] = await db.update(thread)
    .set({
      status: 'active',
      updatedAt: new Date()
    })
    .where(eq(thread.id, id))
    .returning();
  return result;
}

// SOFT DELETE
export async function softDeleteThread(id: string) {
  const [result] = await db.update(thread)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(thread.id, id))
    .returning();
  return result;
}

// HARD DELETE
export async function deleteThread(id: string) {
  const [result] = await db.delete(thread).where(eq(thread.id, id)).returning();
  return result;
}

// RESTORE (undo soft delete)
export async function restoreThread(id: string) {
  const [result] = await db.update(thread)
    .set({
      deletedAt: null,
      updatedAt: new Date()
    })
    .where(eq(thread.id, id))
    .returning();
  return result;
}
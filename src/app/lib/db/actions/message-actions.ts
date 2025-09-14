'use server';

import { db } from '../index';
import { message } from '../schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { DBMessage } from '../schema';

// CREATE
export async function createMessage(data: Omit<DBMessage, 'id' | 'createdAt'>) {
  const [result] = await db.insert(message).values(data).returning();
  return result;
}

// READ (fetch all messages)
export async function getMessages() {
  return await db.select().from(message).orderBy(desc(message.createdAt));
}

// READ (fetch message by ID)
export async function getMessageById(id: string) {
  const [result] = await db.select().from(message).where(eq(message.id, id)).limit(1);
  return result;
}

// READ (fetch messages by chat/thread ID)
export async function getMessagesByChatId(chatId: string) {
  return await db.select().from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt));
}

// READ (fetch training messages by chat ID)
export async function getTrainingMessagesByChatId(chatId: string) {
  return await db.select().from(message)
    .where(and(
      eq(message.chatId, chatId),
      eq(message.isTraining, true)
    ))
    .orderBy(asc(message.createdAt));
}

// READ (fetch non-training messages by chat ID)
export async function getNonTrainingMessagesByChatId(chatId: string) {
  return await db.select().from(message)
    .where(and(
      eq(message.chatId, chatId),
      eq(message.isTraining, false)
    ))
    .orderBy(asc(message.createdAt));
}

// READ (fetch messages by role)
export async function getMessagesByRole(chatId: string, role: string) {
  return await db.select().from(message)
    .where(and(
      eq(message.chatId, chatId),
      eq(message.role, role)
    ))
    .orderBy(asc(message.createdAt));
}

// READ (fetch AI messages for a chat)
export async function getAIMessages(chatId: string) {
  return await db.select().from(message)
    .where(and(
      eq(message.chatId, chatId),
      eq(message.role, 'AI')
    ))
    .orderBy(asc(message.createdAt));
}

// READ (fetch trainee messages for a chat)
export async function getTraineeMessages(chatId: string) {
  return await db.select().from(message)
    .where(and(
      eq(message.chatId, chatId),
      eq(message.role, 'trainee')
    ))
    .orderBy(asc(message.createdAt));
}

// READ (fetch latest message in a chat)
export async function getLatestMessage(chatId: string) {
  const [result] = await db.select().from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(desc(message.createdAt))
    .limit(1);
  return result;
}

// READ (fetch message count for a chat)
export async function getMessageCount(chatId: string) {
  const result = await db.select({ count: message.id }).from(message)
    .where(eq(message.chatId, chatId));
  return result.length;
}

// READ (fetch training message count for a chat)
export async function getTrainingMessageCount(chatId: string) {
  const result = await db.select({ count: message.id }).from(message)
    .where(and(
      eq(message.chatId, chatId),
      eq(message.isTraining, true)
    ));
  return result.length;
}

// UPDATE
export async function updateMessage(id: string, data: Partial<Omit<DBMessage, 'id' | 'createdAt'>>) {
  const [result] = await db.update(message)
    .set(data)
    .where(eq(message.id, id))
    .returning();
  return result;
}

// UPDATE (mark message as training)
export async function markMessageAsTraining(id: string) {
  const [result] = await db.update(message)
    .set({ isTraining: true })
    .where(eq(message.id, id))
    .returning();
  return result;
}

// UPDATE (mark message as non-training)
export async function markMessageAsNonTraining(id: string) {
  const [result] = await db.update(message)
    .set({ isTraining: false })
    .where(eq(message.id, id))
    .returning();
  return result;
}

// DELETE
export async function deleteMessage(id: string) {
  const [result] = await db.delete(message).where(eq(message.id, id)).returning();
  return result;
}

// DELETE (remove all messages for a chat)
export async function deleteMessagesByChatId(chatId: string) {
  return await db.delete(message).where(eq(message.chatId, chatId)).returning();
}

// DELETE (remove training messages for a chat)
export async function deleteTrainingMessagesByChatId(chatId: string) {
  return await db.delete(message)
    .where(and(
      eq(message.chatId, chatId),
      eq(message.isTraining, true)
    ))
    .returning();
}
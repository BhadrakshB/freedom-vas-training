"use server";

import { db } from "@/lib/db";
import { thread, message } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createThread(userId: string, title: string, visibility: "public" | "private" = "private") {
  try {
    const [newThread] = await db
      .insert(thread)
      .values({
        userId,
        title,
        visibility,
        createdAt: new Date(),
      })
      .returning();

    revalidatePath("/");
    return { success: true, thread: newThread };
  } catch (error) {
    console.error("Error creating thread:", error);
    return { success: false, error: "Failed to create thread" };
  }
}

export async function getThreadById(id: string) {
  try {
    const [foundThread] = await db
      .select()
      .from(thread)
      .where(eq(thread.id, id))
      .limit(1);

    return { success: true, thread: foundThread };
  } catch (error) {
    console.error("Error fetching thread:", error);
    return { success: false, error: "Failed to fetch thread" };
  }
}

export async function getThreadsByUserId(userId: string) {
  try {
    const threads = await db
      .select()
      .from(thread)
      .where(eq(thread.userId, userId))
      .orderBy(desc(thread.createdAt));

    return { success: true, threads };
  } catch (error) {
    console.error("Error fetching user threads:", error);
    return { success: false, error: "Failed to fetch threads" };
  }
}

export async function updateThread(id: string, updates: Partial<{ title: string; visibility: "public" | "private" }>) {
  try {
    const [updatedThread] = await db
      .update(thread)
      .set(updates)
      .where(eq(thread.id, id))
      .returning();

    revalidatePath("/");
    return { success: true, thread: updatedThread };
  } catch (error) {
    console.error("Error updating thread:", error);
    return { success: false, error: "Failed to update thread" };
  }
}

export async function deleteThread(id: string) {
  try {
    // First delete all messages in the thread
    await db.delete(message).where(eq(message.chatId, id));
    
    // Then delete the thread
    await db.delete(thread).where(eq(thread.id, id));
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting thread:", error);
    return { success: false, error: "Failed to delete thread" };
  }
}

export async function getThreadWithMessages(threadId: string) {
  try {
    const [threadData] = await db
      .select()
      .from(thread)
      .where(eq(thread.id, threadId))
      .limit(1);

    if (!threadData) {
      return { success: false, error: "Thread not found" };
    }

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, threadId))
      .orderBy(message.createdAt);

    return { 
      success: true, 
      thread: threadData,
      messages 
    };
  } catch (error) {
    console.error("Error fetching thread with messages:", error);
    return { success: false, error: "Failed to fetch thread data" };
  }
}
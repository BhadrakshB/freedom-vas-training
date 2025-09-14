"use server";

import { db } from "../db";
import { message } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMessage(
  chatId: string,
  role: string,
  parts: any,
  attachments: any = [],
  isTraining: boolean = false,
  trainingId?: string
) {
  try {
    const [newMessage] = await db
      .insert(message)
      .values({
        chatId,
        role,
        parts,
        attachments,
        isTraining,
        trainingId,
        createdAt: new Date(),
      })
      .returning();

    revalidatePath("/");
    return { success: true, message: newMessage };
  } catch (error) {
    console.error("Error creating message:", error);
    return { success: false, error: "Failed to create message" };
  }
}

export async function getMessageById(id: string) {
  try {
    const [foundMessage] = await db
      .select()
      .from(message)
      .where(eq(message.id, id))
      .limit(1);

    return { success: true, message: foundMessage };
  } catch (error) {
    console.error("Error fetching message:", error);
    return { success: false, error: "Failed to fetch message" };
  }
}

export async function getMessagesByChatId(chatId: string) {
  try {
    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(message.createdAt);

    return { success: true, messages };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

export async function getTrainingMessages(chatId: string, trainingId: string) {
  try {
    const messages = await db
      .select()
      .from(message)
      .where(
        and(
          eq(message.chatId, chatId),
          eq(message.isTraining, true),
          eq(message.trainingId, trainingId)
        )
      )
      .orderBy(message.createdAt);

    return { success: true, messages };
  } catch (error) {
    console.error("Error fetching training messages:", error);
    return { success: false, error: "Failed to fetch training messages" };
  }
}

export async function getNonTrainingMessages(chatId: string) {
  try {
    const messages = await db
      .select()
      .from(message)
      .where(
        and(
          eq(message.chatId, chatId),
          eq(message.isTraining, false)
        )
      )
      .orderBy(message.createdAt);

    return { success: true, messages };
  } catch (error) {
    console.error("Error fetching non-training messages:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

export async function updateMessage(id: string, updates: Partial<{
  role: string;
  parts: any;
  attachments: any;
  isTraining: boolean;
  trainingId: string;
}>) {
  try {
    const [updatedMessage] = await db
      .update(message)
      .set(updates)
      .where(eq(message.id, id))
      .returning();

    revalidatePath("/");
    return { success: true, message: updatedMessage };
  } catch (error) {
    console.error("Error updating message:", error);
    return { success: false, error: "Failed to update message" };
  }
}

export async function deleteMessage(id: string) {
  try {
    await db.delete(message).where(eq(message.id, id));
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function deleteMessagesByChatId(chatId: string) {
  try {
    await db.delete(message).where(eq(message.chatId, chatId));
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting messages:", error);
    return { success: false, error: "Failed to delete messages" };
  }
}
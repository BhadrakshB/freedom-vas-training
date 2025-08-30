"use server";

import { db } from "@/lib/db";
import { trainings, message } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTraining(
  userId: string,
  threadId: string,
  scenario: any,
  persona: any
) {
  try {
    const [newTraining] = await db
      .insert(trainings)
      .values({
        userId,
        threadId,
        scenario,
        persona,
        status: "active",
        startedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath("/");
    return { success: true, training: newTraining };
  } catch (error) {
    console.error("Error creating training:", error);
    return { success: false, error: "Failed to create training" };
  }
}

export async function getTrainingById(id: string) {
  try {
    const [foundTraining] = await db
      .select()
      .from(trainings)
      .where(eq(trainings.id, id))
      .limit(1);

    return { success: true, training: foundTraining };
  } catch (error) {
    console.error("Error fetching training:", error);
    return { success: false, error: "Failed to fetch training" };
  }
}

export async function getTrainingsByUserId(userId: string) {
  try {
    const userTrainings = await db
      .select()
      .from(trainings)
      .where(eq(trainings.userId, userId))
      .orderBy(desc(trainings.createdAt));

    return { success: true, trainings: userTrainings };
  } catch (error) {
    console.error("Error fetching user trainings:", error);
    return { success: false, error: "Failed to fetch trainings" };
  }
}

export async function getTrainingsByThreadId(threadId: string) {
  try {
    const threadTrainings = await db
      .select()
      .from(trainings)
      .where(eq(trainings.threadId, threadId))
      .orderBy(desc(trainings.createdAt));

    return { success: true, trainings: threadTrainings };
  } catch (error) {
    console.error("Error fetching thread trainings:", error);
    return { success: false, error: "Failed to fetch trainings" };
  }
}

export async function getActiveTraining(userId: string, threadId: string) {
  try {
    const [activeTraining] = await db
      .select()
      .from(trainings)
      .where(
        and(
          eq(trainings.userId, userId),
          eq(trainings.threadId, threadId),
          eq(trainings.status, "active")
        )
      )
      .limit(1);

    return { success: true, training: activeTraining };
  } catch (error) {
    console.error("Error fetching active training:", error);
    return { success: false, error: "Failed to fetch active training" };
  }
}

export async function updateTrainingStatus(
  id: string, 
  status: "active" | "completed" | "paused",
  completedAt?: Date
) {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "completed" && completedAt) {
      updateData.completedAt = completedAt;
    }

    const [updatedTraining] = await db
      .update(trainings)
      .set(updateData)
      .where(eq(trainings.id, id))
      .returning();

    revalidatePath("/");
    return { success: true, training: updatedTraining };
  } catch (error) {
    console.error("Error updating training status:", error);
    return { success: false, error: "Failed to update training status" };
  }
}

export async function updateTrainingScore(id: string, score: any) {
  try {
    const [updatedTraining] = await db
      .update(trainings)
      .set({
        score,
        updatedAt: new Date(),
      })
      .where(eq(trainings.id, id))
      .returning();

    revalidatePath("/");
    return { success: true, training: updatedTraining };
  } catch (error) {
    console.error("Error updating training score:", error);
    return { success: false, error: "Failed to update training score" };
  }
}

export async function updateTrainingFeedback(id: string, feedback: any) {
  try {
    const [updatedTraining] = await db
      .update(trainings)
      .set({
        feedback,
        updatedAt: new Date(),
      })
      .where(eq(trainings.id, id))
      .returning();

    revalidatePath("/");
    return { success: true, training: updatedTraining };
  } catch (error) {
    console.error("Error updating training feedback:", error);
    return { success: false, error: "Failed to update training feedback" };
  }
}

export async function completeTraining(id: string, score?: any, feedback?: any) {
  try {
    const updateData: any = {
      status: "completed" as const,
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    if (score) updateData.score = score;
    if (feedback) updateData.feedback = feedback;

    const [updatedTraining] = await db
      .update(trainings)
      .set(updateData)
      .where(eq(trainings.id, id))
      .returning();

    revalidatePath("/");
    return { success: true, training: updatedTraining };
  } catch (error) {
    console.error("Error completing training:", error);
    return { success: false, error: "Failed to complete training" };
  }
}

export async function deleteTraining(id: string) {
  try {
    // First delete all training messages
    await db.delete(message).where(eq(message.trainingId, id));
    
    // Then delete the training
    await db.delete(trainings).where(eq(trainings.id, id));
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting training:", error);
    return { success: false, error: "Failed to delete training" };
  }
}

export async function getTrainingWithMessages(trainingId: string) {
  try {
    const [training] = await db
      .select()
      .from(trainings)
      .where(eq(trainings.id, trainingId))
      .limit(1);

    if (!training) {
      return { success: false, error: "Training not found" };
    }

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.trainingId, trainingId))
      .orderBy(message.createdAt);

    return { 
      success: true, 
      training,
      messages 
    };
  } catch (error) {
    console.error("Error fetching training with messages:", error);
    return { success: false, error: "Failed to fetch training data" };
  }
}
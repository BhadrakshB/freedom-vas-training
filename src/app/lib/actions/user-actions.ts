"use server";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createUser(email: string, password?: string) {
  try {
    const [newUser] = await db
      .insert(user)
      .values({
        email,
        password,
      })
      .returning();

    revalidatePath("/");
    return { success: true, user: newUser };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function getUserById(id: string) {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return { success: true, user: foundUser };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    return { success: true, user: foundUser };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function updateUser(id: string, updates: Partial<{ email: string; password: string }>) {
  try {
    const [updatedUser] = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning();

    revalidatePath("/");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(id: string) {
  try {
    await db.delete(user).where(eq(user.id, id));
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}
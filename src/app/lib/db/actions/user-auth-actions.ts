'use server';

import { db } from '@/lib/db';
import { userAuth } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { UserAuth } from '../schema';

// CREATE
export async function createUserAuth(data: Omit<UserAuth, 'id' | 'createdAt' | 'updatedAt'>) {
  const [result] = await db.insert(userAuth).values(data).returning();
  return result;
}

// READ (fetch all user auth records)
export async function getUserAuths() {
  return await db.select().from(userAuth);
}

// READ (fetch user auth by ID)
export async function getUserAuthById(id: string) {
  const [result] = await db.select().from(userAuth).where(eq(userAuth.id, id)).limit(1);
  return result;
}

// READ (fetch user auth by user ID)
export async function getUserAuthsByUserId(userId: string) {
  return await db.select().from(userAuth).where(eq(userAuth.userId, userId));
}

// READ (fetch user auth by provider and provider user ID)
export async function getUserAuthByProvider(provider: string, providerUserId: string) {
  const [result] = await db.select().from(userAuth)
    .where(and(
      eq(userAuth.provider, provider),
      eq(userAuth.providerUserId, providerUserId)
    ))
    .limit(1);
  return result;
}

// READ (fetch user auth by email)
export async function getUserAuthByEmail(email: string) {
  const [result] = await db.select().from(userAuth)
    .where(eq(userAuth.email, email))
    .limit(1);
  return result;
}

// UPDATE
export async function updateUserAuth(id: string, data: Partial<Omit<UserAuth, 'id' | 'createdAt' | 'updatedAt'>>) {
  const [result] = await db.update(userAuth)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userAuth.id, id))
    .returning();
  return result;
}

// DELETE
export async function deleteUserAuth(id: string) {
  const [result] = await db.delete(userAuth).where(eq(userAuth.id, id)).returning();
  return result;
}

// DELETE (remove all auth methods for a user)
export async function deleteUserAuthsByUserId(userId: string) {
  return await db.delete(userAuth).where(eq(userAuth.userId, userId)).returning();
}
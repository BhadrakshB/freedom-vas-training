'use server';

import { db } from '../index';
import { user } from '../schema';
import { eq, isNull, desc } from 'drizzle-orm';
import type { User } from '../schema';

// CREATE
export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const [result] = await db.insert(user).values(data).returning();
    return result;
}

// READ (fetch all users)
export async function getUsers() {
    return await db.select().from(user).where(isNull(user.deletedAt)).orderBy(desc(user.createdAt));
}

// READ (fetch a single user by ID)
export async function getUserById(id: string) {
    const [result] = await db.select().from(user)
        .where(eq(user.id, id))
        .limit(1);
    return result;
}

// READ (fetch active users only)
export async function getActiveUsers() {
    return await db.select().from(user)
        .where(isNull(user.deletedAt))
        .orderBy(desc(user.createdAt));
}

// UPDATE
export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) {
    const [result] = await db.update(user)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(user.id, id))
        .returning();
    return result;
}

// SOFT DELETE
export async function softDeleteUser(id: string) {
    const [result] = await db.update(user)
        .set({
            deletedAt: new Date(),
            updatedAt: new Date()
        })
        .where(eq(user.id, id))
        .returning();
    return result;
}

// HARD DELETE
export async function deleteUser(id: string) {
    const [result] = await db.delete(user).where(eq(user.id, id)).returning();
    return result;
}

// RESTORE (undo soft delete)
export async function restoreUser(id: string) {
    const [result] = await db.update(user)
        .set({
            deletedAt: null,
            updatedAt: new Date()
        })
        .where(eq(user.id, id))
        .returning();
    return result;
}
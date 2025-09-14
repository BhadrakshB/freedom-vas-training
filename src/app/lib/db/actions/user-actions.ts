'use server';

import { db } from '../index';
import { user, userAuth } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { User, UserAuth } from '../schema';

// Get or create a user based on Firebase UID
export async function getOrCreateUserByFirebaseUid(
  firebaseUid: string,
  email?: string | null,
  provider: string = 'firebase'
): Promise<{ user: User; userAuth: UserAuth } | null> {
  try {
    // First try to find existing userAuth record
    const existingAuth = await db
      .select()
      .from(userAuth)
      .where(and(
        eq(userAuth.provider, provider),
        eq(userAuth.providerUserId, firebaseUid)
      ))
      .limit(1);

    if (existingAuth.length > 0) {
      // User exists, fetch the user record
      const [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.id, existingAuth[0].userId))
        .limit(1);

      if (userRecord) {
        return {
          user: userRecord,
          userAuth: existingAuth[0]
        };
      }
    }

    // User doesn't exist, create new user and auth records
    const [newUser] = await db.insert(user).values({}).returning();
    
    const [newUserAuth] = await db.insert(userAuth).values({
      userId: newUser.id,
      provider,
      providerUserId: firebaseUid,
      email: email || null
    }).returning();

    return {
      user: newUser,
      userAuth: newUserAuth
    };

  } catch (error) {
    console.error('getOrCreateUserByFirebaseUid: Error:', error);
    return null;
  }
}

// Get user by Firebase UID
export async function getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  try {
    const userAuthRecord = await db
      .select()
      .from(userAuth)
      .where(eq(userAuth.providerUserId, firebaseUid))
      .limit(1);

    if (userAuthRecord.length > 0) {
      const [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.id, userAuthRecord[0].userId))
        .limit(1);
      
      return userRecord || null;
    }

    return null;
  } catch (error) {
    console.error('getUserByFirebaseUid: Error:', error);
    return null;
  }
}

// Get user by internal ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return result || null;
  } catch (error) {
    console.error('getUserById: Error:', error);
    return null;
  }
}

// Update user
export async function updateUser(
  id: string, 
  data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<User | null> {
  try {
    const [result] = await db
      .update(user)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();

    return result || null;
  } catch (error) {
    console.error('updateUser: Error:', error);
    return null;
  }
}

// Soft delete user
export async function softDeleteUser(id: string): Promise<boolean> {
  try {
    await db
      .update(user)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(user.id, id));

    return true;
  } catch (error) {
    console.error('softDeleteUser: Error:', error);
    return false;
  }
}
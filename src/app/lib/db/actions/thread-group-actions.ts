import { db } from "../index";
import { threadGroup, type ThreadGroup } from "../schema";
import { eq, desc } from "drizzle-orm";

// Create a new thread group
export async function createThreadGroup(data: {
    groupName: string;
    groupFeedback?: any;
}): Promise<ThreadGroup> {
    const [newGroup] = await db
        .insert(threadGroup)
        .values({
            groupName: data.groupName,
            groupFeedback: data.groupFeedback || null,
        })
        .returning();

    return newGroup;
}

// Get all thread groups
export async function getAllThreadGroups(): Promise<ThreadGroup[]> {
    return await db
        .select()
        .from(threadGroup)
        .orderBy(desc(threadGroup.createdAt));
}

// Get a thread group by ID
export async function getThreadGroupById(id: string): Promise<ThreadGroup | null> {
    const [group] = await db
        .select()
        .from(threadGroup)
        .where(eq(threadGroup.id, id))
        .limit(1);

    return group || null;
}

// Update a thread group
export async function updateThreadGroup(
    id: string,
    updates: {
        groupName?: string;
        groupFeedback?: any;
    }
): Promise<ThreadGroup | null> {
    const [updatedGroup] = await db
        .update(threadGroup)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(eq(threadGroup.id, id))
        .returning();

    return updatedGroup || null;
}

// Delete a thread group
export async function deleteThreadGroup(id: string): Promise<boolean> {
    const result = await db
        .delete(threadGroup)
        .where(eq(threadGroup.id, id));

    return result.rowCount > 0;
}

// Get thread groups with thread counts
export async function getThreadGroupsWithCounts(): Promise<
    Array<ThreadGroup & { threadCount: number }>
> {
    // First get all groups
    const groups = await db
        .select()
        .from(threadGroup)
        .orderBy(desc(threadGroup.createdAt));

    // For now, return groups with threadCount as 0
    // This will be calculated in the context when threads are loaded
    return groups.map(group => ({
        ...group,
        threadCount: 0,
    }));
}
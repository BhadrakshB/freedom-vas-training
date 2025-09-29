import { NextRequest, NextResponse } from 'next/server';
import {
    createThread,
    getThreads,
    getThreadsByUserId,
    getThreadsByStatus,
    getThreadsByUserAndStatus,
    getPublicThreads,
    getActiveTrainingSessions
} from '@/lib/db/actions/thread-actions';

// GET /api/threads - Get threads with various filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status') as 'active' | 'completed' | 'paused' | null;
        const visibility = searchParams.get('visibility');
        const activeOnly = searchParams.get('activeOnly') === 'true';

        let threads;

        if (activeOnly && userId) {
            threads = await getActiveTrainingSessions(userId);
        } else if (visibility === 'public') {
            threads = await getPublicThreads();
        } else if (userId && status) {
            threads = await getThreadsByUserAndStatus(userId, status);
        } else if (userId) {
            threads = await getThreadsByUserId(userId);
        } else if (status) {
            threads = await getThreadsByStatus(status);
        } else {
            threads = await getThreads();
        }

        return NextResponse.json({
            success: true,
            data: threads
        });

    } catch (error) {
        console.error('Get threads API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to fetch threads',
                errorType: 'server',
                errorCode: 'FETCH_THREADS_ERROR'
            },
            { status: 500 }
        );
    }
}

// POST /api/threads - Create a new thread
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                {
                    error: 'Invalid request body format',
                    errorType: 'validation',
                    errorCode: 'INVALID_REQUEST_BODY'
                },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!body.title || typeof body.title !== 'string') {
            return NextResponse.json(
                {
                    error: 'Title is required and must be a string',
                    errorType: 'validation',
                    errorCode: 'MISSING_TITLE'
                },
                { status: 400 }
            );
        }

        if (!body.userId || typeof body.userId !== 'string') {
            return NextResponse.json(
                {
                    error: 'User ID is required and must be a string',
                    errorType: 'validation',
                    errorCode: 'MISSING_USER_ID'
                },
                { status: 400 }
            );
        }

        if (!body.scenario || typeof body.scenario !== 'object') {
            return NextResponse.json(
                {
                    error: 'Scenario is required and must be an object',
                    errorType: 'validation',
                    errorCode: 'MISSING_SCENARIO'
                },
                { status: 400 }
            );
        }

        if (!body.persona || typeof body.persona !== 'object') {
            return NextResponse.json(
                {
                    error: 'Persona is required and must be an object',
                    errorType: 'validation',
                    errorCode: 'MISSING_PERSONA'
                },
                { status: 400 }
            );
        }

        const thread = await createThread({
            title: body.title,
            userId: body.userId,
            visibility: body.visibility || 'private',
            scenario: body.scenario,
            persona: body.persona,
            status: body.status || 'active',
            score: body.score || null,
            feedback: body.feedback || null,
            startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
            completedAt: body.completedAt ? new Date(body.completedAt) : null,
            version: body.version || '1',
            deletedAt: null,
            groupId: body.groupId || null
        });

        return NextResponse.json({
            success: true,
            data: thread
        }, { status: 201 });

    } catch (error) {
        console.error('Create thread API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to create thread',
                errorType: 'server',
                errorCode: 'CREATE_THREAD_ERROR'
            },
            { status: 500 }
        );
    }
}
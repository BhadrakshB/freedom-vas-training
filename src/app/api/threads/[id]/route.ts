import { NextRequest, NextResponse } from 'next/server';
import {
    getThreadById,
    updateThread,
    softDeleteThread,
    deleteThread,
    restoreThread,
    completeTrainingSession,
    pauseTrainingSession,
    resumeTrainingSession
} from '@/lib/db/actions/thread-actions';

// GET /api/threads/[id] - Get a specific thread
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                {
                    error: 'Thread ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_THREAD_ID'
                },
                { status: 400 }
            );
        }

        const thread = await getThreadById(id);

        if (!thread) {
            return NextResponse.json(
                {
                    error: 'Thread not found',
                    errorType: 'not_found',
                    errorCode: 'THREAD_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: thread
        });

    } catch (error) {
        console.error('Get thread API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to fetch thread',
                errorType: 'server',
                errorCode: 'FETCH_THREAD_ERROR'
            },
            { status: 500 }
        );
    }
}

// PUT /api/threads/[id] - Update a specific thread
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json(
                {
                    error: 'Thread ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_THREAD_ID'
                },
                { status: 400 }
            );
        }

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

        // Prepare update data
        const updateData: any = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.visibility !== undefined) updateData.visibility = body.visibility;
        if (body.scenario !== undefined) updateData.scenario = body.scenario;
        if (body.persona !== undefined) updateData.persona = body.persona;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.score !== undefined) updateData.score = body.score;
        if (body.feedback !== undefined) updateData.feedback = body.feedback;
        if (body.completedAt !== undefined) {
            updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null;
        }
        if (body.version !== undefined) updateData.version = body.version;
        if (body.groupId !== undefined) updateData.groupId = body.groupId;

        // Validate at least one field is provided for update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                {
                    error: 'At least one field must be provided for update',
                    errorType: 'validation',
                    errorCode: 'NO_UPDATE_FIELDS'
                },
                { status: 400 }
            );
        }

        const updatedThread = await updateThread(id, updateData);

        if (!updatedThread) {
            return NextResponse.json(
                {
                    error: 'Thread not found',
                    errorType: 'not_found',
                    errorCode: 'THREAD_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedThread
        });

    } catch (error) {
        console.error('Update thread API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to update thread',
                errorType: 'server',
                errorCode: 'UPDATE_THREAD_ERROR'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/threads/[id] - Delete a specific thread
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const hard = searchParams.get('hard') === 'true';

        if (!id) {
            return NextResponse.json(
                {
                    error: 'Thread ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_THREAD_ID'
                },
                { status: 400 }
            );
        }

        let deletedThread;
        if (hard) {
            deletedThread = await deleteThread(id);
        } else {
            deletedThread = await softDeleteThread(id);
        }

        if (!deletedThread) {
            return NextResponse.json(
                {
                    error: 'Thread not found',
                    errorType: 'not_found',
                    errorCode: 'THREAD_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Thread ${hard ? 'permanently deleted' : 'soft deleted'} successfully`,
            data: deletedThread
        });

    } catch (error) {
        console.error('Delete thread API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to delete thread',
                errorType: 'server',
                errorCode: 'DELETE_THREAD_ERROR'
            },
            { status: 500 }
        );
    }
}
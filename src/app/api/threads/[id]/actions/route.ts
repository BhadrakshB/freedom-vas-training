import { NextRequest, NextResponse } from 'next/server';
import {
    completeTrainingSession,
    pauseTrainingSession,
    resumeTrainingSession,
    restoreThread
} from '@/lib/db/actions/thread-actions';

// POST /api/threads/[id]/actions - Perform specific actions on a thread
export async function POST(
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
        if (!body || typeof body !== 'object' || !body.action) {
            return NextResponse.json(
                {
                    error: 'Action is required in request body',
                    errorType: 'validation',
                    errorCode: 'MISSING_ACTION'
                },
                { status: 400 }
            );
        }

        let result;

        switch (body.action) {
            case 'complete':
                result = await completeTrainingSession(id, body.score, body.feedback);
                break;

            case 'pause':
                result = await pauseTrainingSession(id);
                break;

            case 'resume':
                result = await resumeTrainingSession(id);
                break;

            case 'restore':
                result = await restoreThread(id);
                break;

            default:
                return NextResponse.json(
                    {
                        error: `Invalid action: ${body.action}. Valid actions are: complete, pause, resume, restore`,
                        errorType: 'validation',
                        errorCode: 'INVALID_ACTION'
                    },
                    { status: 400 }
                );
        }

        if (!result) {
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
            message: `Thread ${body.action} action completed successfully`,
            data: result
        });

    } catch (error) {
        console.error('Thread action API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to perform thread action',
                errorType: 'server',
                errorCode: 'THREAD_ACTION_ERROR'
            },
            { status: 500 }
        );
    }
}
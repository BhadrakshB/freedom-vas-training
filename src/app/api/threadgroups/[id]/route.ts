import { NextRequest, NextResponse } from 'next/server';
import {
    getThreadGroupById,
    updateThreadGroup,
    deleteThreadGroup
} from '@/lib/db/actions/thread-group-actions';

// GET /api/threadgroups/[id] - Get a specific thread group
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                {
                    error: 'Thread group ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_THREAD_GROUP_ID'
                },
                { status: 400 }
            );
        }

        const threadGroup = await getThreadGroupById(id);

        if (!threadGroup) {
            return NextResponse.json(
                {
                    error: 'Thread group not found',
                    errorType: 'not_found',
                    errorCode: 'THREAD_GROUP_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: threadGroup
        });

    } catch (error) {
        console.error('Get thread group API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to fetch thread group',
                errorType: 'server',
                errorCode: 'FETCH_THREAD_GROUP_ERROR'
            },
            { status: 500 }
        );
    }
}

// PUT /api/threadgroups/[id] - Update a specific thread group
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
                    error: 'Thread group ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_THREAD_GROUP_ID'
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

        // Validate at least one field is provided for update
        if (!body.groupName && !body.groupFeedback) {
            return NextResponse.json(
                {
                    error: 'At least one field (groupName or groupFeedback) must be provided for update',
                    errorType: 'validation',
                    errorCode: 'NO_UPDATE_FIELDS'
                },
                { status: 400 }
            );
        }

        const updatedThreadGroup = await updateThreadGroup(id, {
            groupName: body.groupName,
            groupFeedback: body.groupFeedback
        });

        if (!updatedThreadGroup) {
            return NextResponse.json(
                {
                    error: 'Thread group not found',
                    errorType: 'not_found',
                    errorCode: 'THREAD_GROUP_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedThreadGroup
        });

    } catch (error) {
        console.error('Update thread group API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to update thread group',
                errorType: 'server',
                errorCode: 'UPDATE_THREAD_GROUP_ERROR'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/threadgroups/[id] - Delete a specific thread group
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                {
                    error: 'Thread group ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_THREAD_GROUP_ID'
                },
                { status: 400 }
            );
        }

        const deleted = await deleteThreadGroup(id);

        if (!deleted) {
            return NextResponse.json(
                {
                    error: 'Thread group not found',
                    errorType: 'not_found',
                    errorCode: 'THREAD_GROUP_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Thread group deleted successfully'
        });

    } catch (error) {
        console.error('Delete thread group API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to delete thread group',
                errorType: 'server',
                errorCode: 'DELETE_THREAD_GROUP_ERROR'
            },
            { status: 500 }
        );
    }
}
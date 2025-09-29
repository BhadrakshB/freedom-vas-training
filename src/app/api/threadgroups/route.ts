import { NextRequest, NextResponse } from 'next/server';
import {
    createThreadGroup,
    getAllThreadGroups,
    getThreadGroupsWithCounts
} from '@/lib/db/actions/thread-group-actions';

// GET /api/threadgroups - Get all thread groups
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeCounts = searchParams.get('includeCounts') === 'true';

        let threadGroups;
        if (includeCounts) {
            threadGroups = await getThreadGroupsWithCounts();
        } else {
            threadGroups = await getAllThreadGroups();
        }

        return NextResponse.json({
            success: true,
            data: threadGroups
        });

    } catch (error) {
        console.error('Get thread groups API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to fetch thread groups',
                errorType: 'server',
                errorCode: 'FETCH_THREAD_GROUPS_ERROR'
            },
            { status: 500 }
        );
    }
}

// POST /api/threadgroups - Create a new thread group
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
        if (!body.groupName || typeof body.groupName !== 'string') {
            return NextResponse.json(
                {
                    error: 'Group name is required and must be a string',
                    errorType: 'validation',
                    errorCode: 'MISSING_GROUP_NAME'
                },
                { status: 400 }
            );
        }

        const threadGroup = await createThreadGroup({
            groupName: body.groupName,
            groupFeedback: body.groupFeedback || null
        });

        return NextResponse.json({
            success: true,
            data: threadGroup
        }, { status: 201 });

    } catch (error) {
        console.error('Create thread group API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to create thread group',
                errorType: 'server',
                errorCode: 'CREATE_THREAD_GROUP_ERROR'
            },
            { status: 500 }
        );
    }
}
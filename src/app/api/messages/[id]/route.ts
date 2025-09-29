import { NextRequest, NextResponse } from 'next/server';
import {
    getMessageById,
    updateMessage,
    deleteMessage,
    updateMessageRatingAndSuggestions,
    markMessageAsTraining,
    markMessageAsNonTraining
} from '@/lib/db/actions/message-actions';

// GET /api/messages/[id] - Get a specific message
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                {
                    error: 'Message ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_MESSAGE_ID'
                },
                { status: 400 }
            );
        }

        const message = await getMessageById(id);

        if (!message) {
            return NextResponse.json(
                {
                    error: 'Message not found',
                    errorType: 'not_found',
                    errorCode: 'MESSAGE_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: message
        });

    } catch (error) {
        console.error('Get message API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to fetch message',
                errorType: 'server',
                errorCode: 'FETCH_MESSAGE_ERROR'
            },
            { status: 500 }
        );
    }
}

// PUT /api/messages/[id] - Update a specific message
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
                    error: 'Message ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_MESSAGE_ID'
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

        if (body.role !== undefined) updateData.role = body.role;
        if (body.parts !== undefined) updateData.parts = body.parts;
        if (body.attachments !== undefined) updateData.attachments = body.attachments;
        if (body.isTraining !== undefined) updateData.isTraining = body.isTraining;
        if (body.messageRating !== undefined) updateData.messageRating = body.messageRating;
        if (body.messageSuggestions !== undefined) updateData.messageSuggestions = body.messageSuggestions;

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

        const updatedMessage = await updateMessage(id, updateData);

        if (!updatedMessage) {
            return NextResponse.json(
                {
                    error: 'Message not found',
                    errorType: 'not_found',
                    errorCode: 'MESSAGE_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedMessage
        });

    } catch (error) {
        console.error('Update message API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to update message',
                errorType: 'server',
                errorCode: 'UPDATE_MESSAGE_ERROR'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/messages/[id] - Delete a specific message
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                {
                    error: 'Message ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_MESSAGE_ID'
                },
                { status: 400 }
            );
        }

        const deletedMessage = await deleteMessage(id);

        if (!deletedMessage) {
            return NextResponse.json(
                {
                    error: 'Message not found',
                    errorType: 'not_found',
                    errorCode: 'MESSAGE_NOT_FOUND'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Message deleted successfully',
            data: deletedMessage
        });

    } catch (error) {
        console.error('Delete message API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to delete message',
                errorType: 'server',
                errorCode: 'DELETE_MESSAGE_ERROR'
            },
            { status: 500 }
        );
    }
}
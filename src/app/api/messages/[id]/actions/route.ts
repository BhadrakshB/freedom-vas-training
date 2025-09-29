import { NextRequest, NextResponse } from 'next/server';
import {
    updateMessageRatingAndSuggestions,
    markMessageAsTraining,
    markMessageAsNonTraining
} from '@/lib/db/actions/message-actions';

// POST /api/messages/[id]/actions - Perform specific actions on a message
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
                    error: 'Message ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_MESSAGE_ID'
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
            case 'updateRatingAndSuggestions':
                if (!body.messageRating && !body.messageSuggestions) {
                    return NextResponse.json(
                        {
                            error: 'At least one of messageRating or messageSuggestions is required',
                            errorType: 'validation',
                            errorCode: 'MISSING_RATING_OR_SUGGESTIONS'
                        },
                        { status: 400 }
                    );
                }
                result = await updateMessageRatingAndSuggestions(
                    id,
                    body.messageRating,
                    body.messageSuggestions
                );
                break;

            case 'markAsTraining':
                result = await markMessageAsTraining(id);
                break;

            case 'markAsNonTraining':
                result = await markMessageAsNonTraining(id);
                break;

            default:
                return NextResponse.json(
                    {
                        error: `Invalid action: ${body.action}. Valid actions are: updateRatingAndSuggestions, markAsTraining, markAsNonTraining`,
                        errorType: 'validation',
                        errorCode: 'INVALID_ACTION'
                    },
                    { status: 400 }
                );
        }

        if (!result) {
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
            message: `Message ${body.action} action completed successfully`,
            data: result
        });

    } catch (error) {
        console.error('Message action API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to perform message action',
                errorType: 'server',
                errorCode: 'MESSAGE_ACTION_ERROR'
            },
            { status: 500 }
        );
    }
}
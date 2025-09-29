import { NextRequest, NextResponse } from 'next/server';
import {
    deleteMessagesByChatId,
    deleteTrainingMessagesByChatId
} from '@/lib/db/actions/message-actions';

// DELETE /api/messages/bulk - Bulk delete messages
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId');
        const trainingOnly = searchParams.get('trainingOnly') === 'true';

        if (!chatId) {
            return NextResponse.json(
                {
                    error: 'Chat ID is required for bulk operations',
                    errorType: 'validation',
                    errorCode: 'MISSING_CHAT_ID'
                },
                { status: 400 }
            );
        }

        let deletedMessages;
        if (trainingOnly) {
            deletedMessages = await deleteTrainingMessagesByChatId(chatId);
        } else {
            deletedMessages = await deleteMessagesByChatId(chatId);
        }

        return NextResponse.json({
            success: true,
            message: `${deletedMessages.length} messages deleted successfully`,
            data: {
                deletedCount: deletedMessages.length,
                deletedMessages
            }
        });

    } catch (error) {
        console.error('Bulk delete messages API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to bulk delete messages',
                errorType: 'server',
                errorCode: 'BULK_DELETE_MESSAGES_ERROR'
            },
            { status: 500 }
        );
    }
}

// POST /api/messages/bulk - Bulk create messages
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        if (!body || !Array.isArray(body.messages)) {
            return NextResponse.json(
                {
                    error: 'Messages array is required in request body',
                    errorType: 'validation',
                    errorCode: 'MISSING_MESSAGES_ARRAY'
                },
                { status: 400 }
            );
        }

        if (body.messages.length === 0) {
            return NextResponse.json(
                {
                    error: 'Messages array cannot be empty',
                    errorType: 'validation',
                    errorCode: 'EMPTY_MESSAGES_ARRAY'
                },
                { status: 400 }
            );
        }

        // Validate each message
        for (let i = 0; i < body.messages.length; i++) {
            const message = body.messages[i];

            if (!message.chatId || typeof message.chatId !== 'string') {
                return NextResponse.json(
                    {
                        error: `Message at index ${i}: Chat ID is required and must be a string`,
                        errorType: 'validation',
                        errorCode: 'INVALID_MESSAGE_CHAT_ID'
                    },
                    { status: 400 }
                );
            }

            if (!message.role || typeof message.role !== 'string') {
                return NextResponse.json(
                    {
                        error: `Message at index ${i}: Role is required and must be a string`,
                        errorType: 'validation',
                        errorCode: 'INVALID_MESSAGE_ROLE'
                    },
                    { status: 400 }
                );
            }

            if (!message.parts || typeof message.parts !== 'object') {
                return NextResponse.json(
                    {
                        error: `Message at index ${i}: Parts is required and must be an object`,
                        errorType: 'validation',
                        errorCode: 'INVALID_MESSAGE_PARTS'
                    },
                    { status: 400 }
                );
            }
        }

        // Create messages
        const { createMessage } = await import('@/lib/db/actions/message-actions');
        const createdMessages = [];

        for (const messageData of body.messages) {
            const message = await createMessage({
                chatId: messageData.chatId,
                role: messageData.role,
                parts: messageData.parts,
                attachments: messageData.attachments || [],
                isTraining: messageData.isTraining || false,
                messageRating: messageData.messageRating || null,
                messageSuggestions: messageData.messageSuggestions || null
            });
            createdMessages.push(message);
        }

        return NextResponse.json({
            success: true,
            message: `${createdMessages.length} messages created successfully`,
            data: {
                createdCount: createdMessages.length,
                createdMessages
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Bulk create messages API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to bulk create messages',
                errorType: 'server',
                errorCode: 'BULK_CREATE_MESSAGES_ERROR'
            },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from 'next/server';
import {
    createMessage,
    createMessageWithRatingAndSuggestions,
    getMessages,
    getMessagesByChatId,
    getTrainingMessagesByChatId,
    getNonTrainingMessagesByChatId,
    getMessagesByRole,
    getAIMessages,
    getTraineeMessages,
    getLatestMessage,
    getMessageCount,
    getTrainingMessageCount
} from '@/lib/db/actions/message-actions';

// GET /api/messages - Get messages with various filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId');
        const role = searchParams.get('role');
        const trainingOnly = searchParams.get('trainingOnly') === 'true';
        const nonTrainingOnly = searchParams.get('nonTrainingOnly') === 'true';
        const latest = searchParams.get('latest') === 'true';
        const count = searchParams.get('count') === 'true';

        let messages;

        if (count && chatId) {
            if (trainingOnly) {
                const messageCount = await getTrainingMessageCount(chatId);
                return NextResponse.json({
                    success: true,
                    data: { count: messageCount }
                });
            } else {
                const messageCount = await getMessageCount(chatId);
                return NextResponse.json({
                    success: true,
                    data: { count: messageCount }
                });
            }
        }

        if (latest && chatId) {
            messages = await getLatestMessage(chatId);
            return NextResponse.json({
                success: true,
                data: messages
            });
        }

        if (chatId && role) {
            if (role === 'AI') {
                messages = await getAIMessages(chatId);
            } else if (role === 'trainee') {
                messages = await getTraineeMessages(chatId);
            } else {
                messages = await getMessagesByRole(chatId, role);
            }
        } else if (chatId && trainingOnly) {
            messages = await getTrainingMessagesByChatId(chatId);
        } else if (chatId && nonTrainingOnly) {
            messages = await getNonTrainingMessagesByChatId(chatId);
        } else if (chatId) {
            messages = await getMessagesByChatId(chatId);
        } else {
            messages = await getMessages();
        }

        return NextResponse.json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('Get messages API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to fetch messages',
                errorType: 'server',
                errorCode: 'FETCH_MESSAGES_ERROR'
            },
            { status: 500 }
        );
    }
}

// POST /api/messages - Create a new message
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
        if (!body.chatId || typeof body.chatId !== 'string') {
            return NextResponse.json(
                {
                    error: 'Chat ID is required and must be a string',
                    errorType: 'validation',
                    errorCode: 'MISSING_CHAT_ID'
                },
                { status: 400 }
            );
        }

        if (!body.role || typeof body.role !== 'string') {
            return NextResponse.json(
                {
                    error: 'Role is required and must be a string',
                    errorType: 'validation',
                    errorCode: 'MISSING_ROLE'
                },
                { status: 400 }
            );
        }

        if (!body.parts || typeof body.parts !== 'object') {
            return NextResponse.json(
                {
                    error: 'Parts is required and must be an object',
                    errorType: 'validation',
                    errorCode: 'MISSING_PARTS'
                },
                { status: 400 }
            );
        }

        let message;

        // Check if message includes rating and suggestions
        if (body.messageRating || body.messageSuggestions) {
            message = await createMessageWithRatingAndSuggestions({
                chatId: body.chatId,
                role: body.role,
                parts: body.parts,
                attachments: body.attachments || [],
                isTraining: body.isTraining || false,
                messageRating: body.messageRating || null,
                messageSuggestions: body.messageSuggestions || null
            });
        } else {
            message = await createMessage({
                chatId: body.chatId,
                role: body.role,
                parts: body.parts,
                attachments: body.attachments || [],
                isTraining: body.isTraining || false,
                messageRating: body.messageRating || null,
                messageSuggestions: body.messageSuggestions || null
            });
        }

        return NextResponse.json({
            success: true,
            data: message
        }, { status: 201 });

    } catch (error) {
        console.error('Create message API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to create message',
                errorType: 'server',
                errorCode: 'CREATE_MESSAGE_ERROR'
            },
            { status: 500 }
        );
    }
}
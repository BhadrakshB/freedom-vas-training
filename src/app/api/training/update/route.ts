import { NextRequest, NextResponse } from 'next/server';
import { updateTrainingSession } from '@/lib/actions/training-actions';
import { ScenarioGeneratorSchema, PersonaGeneratorSchema } from '@/lib/agents/v2/graph_v2';
import { BaseMessage } from '@langchain/core/messages';
import { createMessageWithRatingAndSuggestions } from '@/lib/db/actions/message-actions';
import { updateThread, completeTrainingSession } from '@/lib/db/actions/thread-actions';

interface UpdateTrainingRequestBody {
    scenario: ScenarioGeneratorSchema;
    guestPersona: PersonaGeneratorSchema;
    messages: BaseMessage[];
    threadId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: UpdateTrainingRequestBody = await request.json();

        // Validate required fields
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

        if (!body.scenario) {
            return NextResponse.json(
                {
                    error: 'Scenario is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_SCENARIO'
                },
                { status: 400 }
            );
        }

        if (!body.guestPersona) {
            return NextResponse.json(
                {
                    error: 'Guest persona is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_PERSONA'
                },
                { status: 400 }
            );
        }

        if (!body.messages || !Array.isArray(body.messages)) {
            return NextResponse.json(
                {
                    error: 'Messages array is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_MESSAGES'
                },
                { status: 400 }
            );
        }

        if (!body.threadId || typeof body.threadId !== 'string') {
            return NextResponse.json(
                {
                    error: 'Thread ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_THREAD_ID'
                },
                { status: 400 }
            );
        }

        // Call the training action
        const result = await updateTrainingSession({
            scenario: body.scenario,
            guestPersona: body.guestPersona,
            messages: body.messages
        });

        // Check if there was an error in the result
        if (result.error) {
            const statusCode = result.errorType === 'validation' ? 400 : 500;
            return NextResponse.json(
                {
                    error: result.error,
                    errorType: result.errorType,
                    errorCode: result.errorCode,
                },
                { status: statusCode }
            );
        }

        // Save new messages to database
        const savedMessages = [];
        if (result.messages && result.messages.length > body.messages.length) {
            // Get the new messages (assuming they're at the end)
            const newMessages = result.messages.slice(body.messages.length);

            for (const message of newMessages) {
                const savedMessage = await createMessageWithRatingAndSuggestions({
                    chatId: body.threadId,
                    role: message._getType() === 'human' ? 'trainee' : 'AI',
                    parts: { content: message.content },
                    attachments: [],
                    isTraining: true,
                    messageRating: result.lastMessageRating || null,
                    messageSuggestions: result.lastMessageRatingReason || null,
                });
                savedMessages.push(savedMessage);
            }
        }

        // Update thread with latest activity (updatedAt is handled automatically)
        const updatedThread = await updateThread(body.threadId, {});

        // If training is completed, update thread with feedback
        let completedThread = null;
        if (result.status === 'completed' && result.feedback) {
            completedThread = await completeTrainingSession(
                body.threadId,
                null, // score - can be added later if needed
                result.feedback
            );
        }

        // Return successful response
        return NextResponse.json({
            success: true,
            data: {
                // Training session data
                scenario: result.scenario,
                guestPersona: result.guestPersona,
                messages: result.messages,
                guestResponse: result.guestResponse,
                status: result.status,
                lastMessageRating: result.lastMessageRating,
                lastMessageRatingReason: result.lastMessageRatingReason,
                feedback: result.feedback,
                // Database data
                savedMessages: savedMessages,
                updatedThread: completedThread || updatedThread,
                threadId: body.threadId
            }
        });

    } catch (error) {
        console.error('Update training session API error:', error);

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                errorType: 'server',
                errorCode: 'INTERNAL_SERVER_ERROR'
            },
            { status: 500 }
        );
    }
}
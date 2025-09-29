import { NextRequest, NextResponse } from 'next/server';
import { startTrainingSession } from '@/lib/actions/training-actions';
import { ScenarioGeneratorSchema, PersonaGeneratorSchema } from '@/lib/agents/v2/graph_v2';
import { createThread } from '@/lib/db/actions/thread-actions';
import { createMessage } from '@/lib/db/actions/message-actions';

interface StartTrainingRequestBody {
    scenario?: ScenarioGeneratorSchema;
    guestPersona?: PersonaGeneratorSchema;
    userId: string;
    title?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: StartTrainingRequestBody = await request.json();

        // Validate request body structure
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

        // Validate required userId
        if (!body.userId || typeof body.userId !== 'string') {
            return NextResponse.json(
                {
                    error: 'User ID is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_USER_ID'
                },
                { status: 400 }
            );
        }

        // Call the training action
        const result = await startTrainingSession({
            scenario: body.scenario,
            guestPersona: body.guestPersona
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

        // Create thread in database
        const threadTitle = body.title ||
            result.scenario?.scenario_title ||
            'Training Session';

        const newThread = await createThread({
            title: threadTitle,
            userId: body.userId,
            visibility: 'private',
            scenario: result.scenario || {},
            persona: result.guestPersona || {},
            status: 'active',
            score: null,
            feedback: null,
            startedAt: new Date(),
            completedAt: null,
            version: '2',
            deletedAt: null,
            groupId: null
        });

        // Save initial messages to database
        const savedMessages = [];
        if (result.messages && result.messages.length > 0) {
            for (const message of result.messages) {
                const savedMessage = await createMessage({
                    chatId: newThread.id,
                    role: message._getType() === 'human' ? 'trainee' : 'AI',
                    parts: { content: message.content },
                    attachments: [],
                    isTraining: true,
                    messageRating: null,
                    messageSuggestions: null,
                });
                savedMessages.push(savedMessage);
            }
        }

        // Return successful response with database data
        return NextResponse.json({
            success: true,
            data: {
                // Training session data
                scenario: result.scenario,
                guestPersona: result.guestPersona,
                messages: result.messages,
                finalOutput: result.finalOutput,
                // Database data
                thread: newThread,
                savedMessages: savedMessages,
                threadId: newThread.id
            }
        });

    } catch (error) {
        console.error('Start training session API error:', error);

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
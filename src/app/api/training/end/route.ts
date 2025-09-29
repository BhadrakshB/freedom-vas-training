import { NextRequest, NextResponse } from 'next/server';
import { endTrainingSession } from '@/lib/actions/training-actions';
import { ScenarioGeneratorSchema, PersonaGeneratorSchema } from '@/lib/agents/v2/graph_v2';
import { BaseMessage } from '@langchain/core/messages';
import { completeTrainingSession } from '@/lib/db/actions/thread-actions';

interface EndTrainingRequestBody {
    scenario: ScenarioGeneratorSchema;
    guestPersona: PersonaGeneratorSchema;
    messages: BaseMessage[];
    threadId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: EndTrainingRequestBody = await request.json();

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
        const result = await endTrainingSession({
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

        // Complete the training session in database
        const completedThread = await completeTrainingSession(
            body.threadId,
            null, // score - can be added later if needed
            result.feedback
        );

        // Return successful response
        return NextResponse.json({
            success: true,
            data: {
                // Training session data
                feedback: result.feedback,
                status: result.status,
                // Database data
                completedThread: completedThread,
                threadId: body.threadId
            }
        });

    } catch (error) {
        console.error('End training session API error:', error);

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
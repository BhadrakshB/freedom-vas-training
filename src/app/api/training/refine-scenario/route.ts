import { NextRequest, NextResponse } from 'next/server';
import { refineScenario } from '@/lib/actions/training-actions';

interface RefineScenarioRequestBody {
    scenario: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: RefineScenarioRequestBody = await request.json();

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

        if (!body.scenario || typeof body.scenario !== 'string') {
            return NextResponse.json(
                {
                    error: 'Scenario string is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_SCENARIO'
                },
                { status: 400 }
            );
        }

        // Call the training action
        const result = await refineScenario(body);

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

        // Return successful response
        return NextResponse.json({
            success: true,
            data: {
                refinedScenario: result.refinedScenario,
                originalScenario: result.originalScenario,
            }
        });

    } catch (error) {
        console.error('Refine scenario API error:', error);

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
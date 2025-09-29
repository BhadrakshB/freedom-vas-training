import { NextRequest, NextResponse } from 'next/server';
import { refinePersona } from '@/lib/actions/training-actions';

interface RefinePersonaRequestBody {
    persona: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: RefinePersonaRequestBody = await request.json();

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

        if (!body.persona || typeof body.persona !== 'string') {
            return NextResponse.json(
                {
                    error: 'Persona string is required',
                    errorType: 'validation',
                    errorCode: 'MISSING_PERSONA'
                },
                { status: 400 }
            );
        }

        // Call the training action
        const result = await refinePersona(body);

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
                refinedPersona: result.refinedPersona,
                originalPersona: result.originalPersona,
            }
        });

    } catch (error) {
        console.error('Refine persona API error:', error);

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
import { BaseMessage } from '@langchain/core/messages';
import {
    ScenarioGeneratorSchema,
    PersonaGeneratorSchema,
    FeedbackSchema,
    MessageRatingSchema,
    AlternativeSuggestionsSchema,
    TrainingStateType
} from '@/lib/agents/v2/graph_v2';

// API Response Types
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    errorType?: string;
    errorCode?: string;
}

interface StartTrainingResponse {
    scenario?: ScenarioGeneratorSchema;
    guestPersona?: PersonaGeneratorSchema;
    messages: BaseMessage[];
    finalOutput?: any;
    thread?: any;
    savedMessages?: any[];
    threadId?: string;
}

interface UpdateTrainingResponse {
    scenario?: ScenarioGeneratorSchema;
    guestPersona?: PersonaGeneratorSchema;
    messages: BaseMessage[];
    guestResponse: any;
    status: TrainingStateType;
    lastMessageRating?: MessageRatingSchema | null;
    lastMessageRatingReason?: AlternativeSuggestionsSchema | null;
    feedback?: FeedbackSchema;
    savedMessages?: any[];
    updatedThread?: any;
    threadId?: string;
}

interface EndTrainingResponse {
    feedback?: FeedbackSchema;
    status: TrainingStateType;
    completedThread?: any;
    threadId?: string;
}

interface RefineScenarioResponse {
    refinedScenario?: ScenarioGeneratorSchema;
    originalScenario: string;
}

interface RefinePersonaResponse {
    refinedPersona?: PersonaGeneratorSchema;
    originalPersona: string;
}

// API Client Class
export class TrainingApiClient {
    private static baseUrl = '/api/training';

    private static async makeRequest<T>(
        endpoint: string,
        data?: any
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data ? JSON.stringify(data) : undefined,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Request failed',
                    errorType: result.errorType || 'unknown',
                    errorCode: result.errorCode || 'UNKNOWN_ERROR',
                };
            }

            return result;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
                errorType: 'network',
                errorCode: 'NETWORK_ERROR',
            };
        }
    }

    /**
     * Start a new training session
     */
    static async startTrainingSession(params: {
        userId: string;
        scenario?: ScenarioGeneratorSchema;
        guestPersona?: PersonaGeneratorSchema;
        title?: string;
    }): Promise<ApiResponse<StartTrainingResponse>> {
        return this.makeRequest<StartTrainingResponse>('/start', params);
    }

    /**
     * Update an existing training session
     */
    static async updateTrainingSession(params: {
        scenario: ScenarioGeneratorSchema;
        guestPersona: PersonaGeneratorSchema;
        messages: BaseMessage[];
        threadId: string;
    }): Promise<ApiResponse<UpdateTrainingResponse>> {
        return this.makeRequest<UpdateTrainingResponse>('/update', params);
    }

    /**
     * End a training session and get feedback
     */
    static async endTrainingSession(params: {
        scenario: ScenarioGeneratorSchema;
        guestPersona: PersonaGeneratorSchema;
        messages: BaseMessage[];
        threadId: string;
    }): Promise<ApiResponse<EndTrainingResponse>> {
        return this.makeRequest<EndTrainingResponse>('/end', params);
    }

    /**
     * Refine a scenario description
     */
    static async refineScenario(params: {
        scenario: string;
    }): Promise<ApiResponse<RefineScenarioResponse>> {
        return this.makeRequest<RefineScenarioResponse>('/refine-scenario', params);
    }

    /**
     * Refine a persona description
     */
    static async refinePersona(params: {
        persona: string;
    }): Promise<ApiResponse<RefinePersonaResponse>> {
        return this.makeRequest<RefinePersonaResponse>('/refine-persona', params);
    }
}

// Convenience functions for direct use
export const startTrainingSession = TrainingApiClient.startTrainingSession.bind(TrainingApiClient);
export const updateTrainingSession = TrainingApiClient.updateTrainingSession.bind(TrainingApiClient);
export const endTrainingSession = TrainingApiClient.endTrainingSession.bind(TrainingApiClient);
export const refineScenario = TrainingApiClient.refineScenario.bind(TrainingApiClient);
export const refinePersona = TrainingApiClient.refinePersona.bind(TrainingApiClient);
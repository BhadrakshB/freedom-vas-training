/**
 * Example usage of the Training API Client
 * 
 * This file demonstrates how to use the training APIs in your components
 */

import { TrainingApiClient } from './training-client';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Example: Start a new training session
export async function exampleStartTraining(userId: string) {
    try {
        const response = await TrainingApiClient.startTrainingSession({
            userId: userId
        });

        if (response.success && response.data) {
            console.log('Training session started successfully');
            console.log('Generated scenario:', response.data.scenario);
            console.log('Generated persona:', response.data.guestPersona);
            console.log('Initial messages:', response.data.messages);
            console.log('Thread ID:', response.data.threadId);
            console.log('Database thread:', response.data.thread);
            return response.data;
        } else {
            console.error('Failed to start training:', response.error);
            throw new Error(response.error || 'Failed to start training');
        }
    } catch (error) {
        console.error('Error starting training session:', error);
        throw error;
    }
}

// Example: Start training with custom scenario and persona
export async function exampleStartTrainingWithCustomData() {
    try {
        const customScenario = {
            scenario_title: "Overbooking Issue",
            business_context: "Peak season with high demand leading to overbooking situations",
            guest_situation: "A guest arrives to find their reservation was overbooked and no room is available",
            constraints_and_policies: [
                "Must offer alternative accommodation",
                "Compensation policy applies for overbooking",
                "Maintain brand reputation"
            ],
            expected_va_challenges: [
                "Managing guest frustration",
                "Finding suitable alternatives quickly",
                "Balancing company policy with guest satisfaction"
            ],
            difficulty_level: "Medium" as const,
            success_criteria: [
                "Guest accepts alternative accommodation",
                "Maintains positive relationship",
                "Follows company compensation policy"
            ]
        };

        const customPersona = {
            name: "Sarah Johnson",
            demographics: "35-year-old business traveler from New York",
            personality_traits: ["Professional", "Direct", "Time-conscious", "Results-oriented"],
            communication_style: "Formal and efficient, expects quick resolutions",
            emotional_tone: "Initially frustrated but willing to work toward a solution",
            expectations: [
                "Quick resolution",
                "Professional service",
                "Fair compensation for inconvenience"
            ],
            escalation_behavior: [
                "Becomes more demanding if delays occur",
                "May request manager if not satisfied",
                "Could threaten negative reviews"
            ]
        };

        const response = await TrainingApiClient.startTrainingSession({
            userId: "example-user-id", // Replace with actual user ID
            scenario: customScenario,
            guestPersona: customPersona,
            title: "Custom Overbooking Training"
        });

        if (response.success && response.data) {
            console.log('Custom training session started successfully');
            return response.data;
        } else {
            console.error('Failed to start custom training:', response.error);
            throw new Error(response.error || 'Failed to start training');
        }
    } catch (error) {
        console.error('Error starting custom training session:', error);
        throw error;
    }
}

// Example: Update training session with new message
export async function exampleUpdateTraining(
    scenario: any,
    guestPersona: any,
    existingMessages: any[],
    newUserMessage: string,
    threadId: string
) {
    try {
        // Add the new user message to the conversation
        const updatedMessages = [
            ...existingMessages,
            new HumanMessage(newUserMessage)
        ];

        const response = await TrainingApiClient.updateTrainingSession({
            scenario,
            guestPersona,
            messages: updatedMessages,
            threadId
        });

        if (response.success && response.data) {
            console.log('Training session updated successfully');
            console.log('Guest response:', response.data.guestResponse);
            console.log('Message rating:', response.data.lastMessageRating);
            console.log('Suggestions:', response.data.lastMessageRatingReason);
            console.log('Status:', response.data.status);
            return response.data;
        } else {
            console.error('Failed to update training:', response.error);
            throw new Error(response.error || 'Failed to update training');
        }
    } catch (error) {
        console.error('Error updating training session:', error);
        throw error;
    }
}

// Example: End training session and get feedback
export async function exampleEndTraining(
    scenario: any,
    guestPersona: any,
    messages: any[],
    threadId: string
) {
    try {
        const response = await TrainingApiClient.endTrainingSession({
            scenario,
            guestPersona,
            messages,
            threadId
        });

        if (response.success && response.data) {
            console.log('Training session ended successfully');
            console.log('Final feedback:', response.data.feedback);
            console.log('Final status:', response.data.status);
            return response.data;
        } else {
            console.error('Failed to end training:', response.error);
            throw new Error(response.error || 'Failed to end training');
        }
    } catch (error) {
        console.error('Error ending training session:', error);
        throw error;
    }
}

// Example: Refine a scenario
export async function exampleRefineScenario(scenarioText: string) {
    try {
        const response = await TrainingApiClient.refineScenario({
            scenario: scenarioText
        });

        if (response.success && response.data) {
            console.log('Scenario refined successfully');
            console.log('Original:', response.data.originalScenario);
            console.log('Refined:', response.data.refinedScenario);
            return response.data;
        } else {
            console.error('Failed to refine scenario:', response.error);
            throw new Error(response.error || 'Failed to refine scenario');
        }
    } catch (error) {
        console.error('Error refining scenario:', error);
        throw error;
    }
}

// Example: Refine a persona
export async function exampleRefinePersona(personaText: string) {
    try {
        const response = await TrainingApiClient.refinePersona({
            persona: personaText
        });

        if (response.success && response.data) {
            console.log('Persona refined successfully');
            console.log('Original:', response.data.originalPersona);
            console.log('Refined:', response.data.refinedPersona);
            return response.data;
        } else {
            console.error('Failed to refine persona:', response.error);
            throw new Error(response.error || 'Failed to refine persona');
        }
    } catch (error) {
        console.error('Error refining persona:', error);
        throw error;
    }
}

// Example: Complete training workflow
export async function exampleCompleteTrainingWorkflow(userId: string) {
    try {
        // 1. Start training session
        console.log('Starting training session...');
        const startResult = await exampleStartTraining(userId);
        const threadId = startResult.threadId!;

        // 2. Simulate some conversation
        console.log('Simulating conversation...');
        let currentMessages = startResult.messages;

        // User sends first message
        const updateResult1 = await exampleUpdateTraining(
            startResult.scenario,
            startResult.guestPersona,
            currentMessages,
            "Hello, I'm having an issue with my reservation.",
            threadId
        );

        currentMessages = updateResult1.messages;

        // User sends second message
        const updateResult2 = await exampleUpdateTraining(
            startResult.scenario,
            startResult.guestPersona,
            currentMessages,
            "I understand the situation. What alternatives can you offer?",
            threadId
        );

        currentMessages = updateResult2.messages;

        // 3. End training session
        console.log('Ending training session...');
        const endResult = await exampleEndTraining(
            startResult.scenario,
            startResult.guestPersona,
            currentMessages,
            threadId
        );

        console.log('Complete training workflow finished successfully');
        return {
            startResult,
            updateResults: [updateResult1, updateResult2],
            endResult
        };

    } catch (error) {
        console.error('Error in complete training workflow:', error);
        throw error;
    }
}
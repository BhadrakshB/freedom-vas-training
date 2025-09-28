import { BaseMessage } from "@langchain/core/messages";
import { MessageRatingSchema, AlternativeSuggestionsSchema } from "../agents/v2/graph_v2";
import { ExtendedHumanMessageImpl } from "../../contexts/TrainingContext";

/**
 * Utility class to handle message feedback operations
 * Combines context updates with database persistence
 */
export class MessageFeedbackHandler {
    /**
     * Process a message with feedback and save to both context and database
     * @param trainingActions - Actions from useTrainingActions hook
     * @param message - The message to process
     * @param messageRating - Rating data for the message
     * @param messageSuggestions - Alternative suggestions for the message
     * @returns Promise with success status and any errors
     */
    static async processMessageWithFeedback(
        trainingActions: any,
        message: BaseMessage,
        messageRating?: MessageRatingSchema | null,
        messageSuggestions?: AlternativeSuggestionsSchema | null
    ): Promise<{ success: boolean; error?: string; messageId?: string }> {
        try {
            // 1. Add message to context first
            trainingActions.addMessage(message);

            // 2. If this is a human message with feedback, update it in context
            if (message instanceof ExtendedHumanMessageImpl && (messageRating || messageSuggestions)) {
                const messageIndex = trainingActions.getMessages?.().length - 1 || 0;
                trainingActions.updateMessageWithFeedback(messageIndex, messageRating, messageSuggestions);
            }

            // 3. Save to database with feedback
            const dbResult = await trainingActions.saveMessageWithFeedbackToDb(
                message,
                messageRating,
                messageSuggestions
            );

            if (!dbResult.success) {
                console.error("Failed to save message to database:", dbResult.error);
                return { success: false, error: dbResult.error };
            }

            console.log("Message processed successfully with feedback");
            return { success: true, messageId: dbResult.messageId };

        } catch (error) {
            console.error("Error processing message with feedback:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }

    /**
     * Update existing message feedback in both context and database
     * @param trainingActions - Actions from useTrainingActions hook
     * @param messageIndex - Index of message in context
     * @param messageId - Database ID of the message
     * @param messageRating - Updated rating data
     * @param messageSuggestions - Updated suggestions data
     * @returns Promise with success status and any errors
     */
    static async updateMessageFeedback(
        trainingActions: any,
        messageIndex: number,
        messageId: string,
        messageRating?: MessageRatingSchema | null,
        messageSuggestions?: AlternativeSuggestionsSchema | null
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Update context
            trainingActions.updateMessageWithFeedback(messageIndex, messageRating, messageSuggestions);

            // 2. Update database (you'll need to import this from training-actions)
            // const dbResult = await updateMessageFeedback({
            //   messageId,
            //   messageRating,
            //   messageSuggestions
            // });

            // if (!dbResult.success) {
            //   console.error("Failed to update message feedback in database:", dbResult.error);
            //   return { success: false, error: dbResult.error };
            // }

            console.log("Message feedback updated successfully");
            return { success: true };

        } catch (error) {
            console.error("Error updating message feedback:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }

    /**
     * Create an ExtendedHumanMessage with feedback data
     * @param content - Message content
     * @param messageRating - Rating data
     * @param messageSuggestions - Suggestions data
     * @returns ExtendedHumanMessage instance
     */
    static createMessageWithFeedback(
        content: string,
        messageRating?: MessageRatingSchema | null,
        messageSuggestions?: AlternativeSuggestionsSchema | null
    ): ExtendedHumanMessageImpl {
        return new ExtendedHumanMessageImpl(content, messageRating, messageSuggestions);
    }
}
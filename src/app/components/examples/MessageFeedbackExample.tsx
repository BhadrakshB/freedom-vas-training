"use client";

import React, { useState } from "react";
import {
  useTrainingActions,
  ExtendedHumanMessageImpl,
} from "../../contexts/TrainingContext";
import {
  MessageRatingSchema,
  AlternativeSuggestionsSchema,
} from "../../lib/agents/v2/graph_v2";
import { MessageFeedbackHandler } from "../../lib/utils/message-feedback-handler";

interface MessageFeedbackExampleProps {
  trainingId: string;
}

/**
 * Example component demonstrating how to handle message feedback
 * This shows the complete workflow of:
 * 1. Creating a message with feedback
 * 2. Saving to context and database
 * 3. Updating feedback later
 */
export function MessageFeedbackExample({
  trainingId,
}: MessageFeedbackExampleProps) {
  const trainingActions = useTrainingActions(trainingId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");

  // Example feedback data
  const exampleRating: MessageRatingSchema = {
    Message_Rating: {
      Rating: 7,
      Rationale:
        "Good response but could be more empathetic and provide specific next steps.",
    },
  };

  const exampleSuggestions: AlternativeSuggestionsSchema = {
    Alternative_Suggestions: [
      {
        Response:
          "I understand your frustration with the booking issue. Let me personally look into this right away and get back to you within the next hour with a solution.",
        Explanation: "More empathetic tone with specific timeline commitment",
      },
      {
        Response:
          "I apologize for the inconvenience. I'm escalating this to our booking specialist who will contact you directly within 30 minutes to resolve this.",
        Explanation: "Takes ownership and provides clear escalation path",
      },
    ],
  };

  const handleSendMessageWithFeedback = async () => {
    if (!trainingActions) {
      setStatus("No training actions available");
      return;
    }

    setIsProcessing(true);
    setStatus("Processing message with feedback...");

    try {
      // Create message with feedback
      const messageContent =
        "I'll look into your booking issue and get back to you soon.";
      const messageWithFeedback =
        MessageFeedbackHandler.createMessageWithFeedback(
          messageContent,
          exampleRating,
          exampleSuggestions
        );

      // Process and save the message
      const result = await MessageFeedbackHandler.processMessageWithFeedback(
        trainingActions,
        messageWithFeedback,
        exampleRating,
        exampleSuggestions
      );

      if (result.success) {
        setStatus(
          `✅ Message saved successfully! Database ID: ${result.messageId}`
        );
      } else {
        setStatus(`❌ Failed to save message: ${result.error}`);
      }
    } catch (error) {
      setStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateFeedback = async () => {
    if (!trainingActions) {
      setStatus("No training actions available");
      return;
    }

    setIsProcessing(true);
    setStatus("Updating message feedback...");

    try {
      // Updated rating
      const updatedRating: MessageRatingSchema = {
        Message_Rating: {
          Rating: 9,
          Rationale:
            "Excellent response with clear empathy and specific action plan.",
        },
      };

      // Assume we're updating the last message (index -1)
      const messageIndex = 0; // This would be the actual index
      const messageId = "some-db-message-id"; // This would come from the previous save

      const result = await MessageFeedbackHandler.updateMessageFeedback(
        trainingActions,
        messageIndex,
        messageId,
        updatedRating,
        exampleSuggestions
      );

      if (result.success) {
        setStatus("✅ Message feedback updated successfully!");
      } else {
        setStatus(`❌ Failed to update feedback: ${result.error}`);
      }
    } catch (error) {
      setStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!trainingActions) {
    return <div>No training session active</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Message Feedback Example</h2>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Example Rating:</h3>
          <pre className="text-sm bg-white p-2 rounded">
            {JSON.stringify(exampleRating, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Example Suggestions:</h3>
          <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify(exampleSuggestions, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSendMessageWithFeedback}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Send Message with Feedback"}
          </button>

          <button
            onClick={handleUpdateFeedback}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Update Feedback"}
          </button>
        </div>

        {status && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-mono text-sm">{status}</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Notes:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Messages are saved to both the training context and database</li>
          <li>Rating and suggestions are stored as JSON in the database</li>
          <li>ExtendedHumanMessage class handles feedback data in memory</li>
          <li>Use MessageFeedbackHandler for consistent processing</li>
          <li>Always check for success/error responses</li>
        </ul>
      </div>
    </div>
  );
}

import { useState, useTransition } from 'react';
import {
  startTrainingSession,
  updateTrainingSession,
  endTrainingSession
} from '../actions';

// Type definitions for better type safety
type StartTrainingResponse = Awaited<ReturnType<typeof startTrainingSession>>;
type UpdateTrainingRequest = Parameters<typeof updateTrainingSession>[0];
type UpdateTrainingResponse = Awaited<ReturnType<typeof updateTrainingSession>>;
type EndTrainingRequest = Parameters<typeof endTrainingSession>[0];
type EndTrainingResponse = Awaited<ReturnType<typeof endTrainingSession>>;

// Hook for training actions
export function useTrainingActions() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const startSession = async (): Promise<StartTrainingResponse> => {
    setError(null);
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await startTrainingSession();
          if (result.error) {
            setError(result.error);
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          reject(err);
        }
      });
    });
  };

  const updateSession = async (request: UpdateTrainingRequest): Promise<UpdateTrainingResponse> => {
    setError(null);
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await updateTrainingSession(request);
          if (result.error) {
            setError(result.error);
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          reject(err);
        }
      });
    });
  };

  const endSession = async (request: EndTrainingRequest): Promise<EndTrainingResponse> => {
    setError(null);
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await endTrainingSession(request);
          if (result.error) {
            setError(result.error);
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          reject(err);
        }
      });
    });
  };

  return {
    startSession,
    updateSession,
    endSession,
    isPending,
    error,
    clearError: () => setError(null),
  };
}
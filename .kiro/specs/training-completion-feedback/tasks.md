# Implementation Plan

- [x] 1. Create FeedbackPanel component for displaying training completion feedback
  - Create new component file `src/app/components/FeedbackPanel.tsx`
  - Implement props interface for FeedbackSchema and callback functions
  - Design card-based layout with sections for overall feedback, critical messages, strengths, and improvements
  - Add "Start New Training Session" CTA button
  - Include proper TypeScript types and error handling for missing feedback data
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1_

- [x] 2. Create TrainingStatusIndicator component for visual status feedback
  - Create new component file `src/app/components/TrainingStatusIndicator.tsx`
  - Implement props interface for TrainingStateType and optional className
  - Add status-specific icons and color coding (blue for ongoing, green for completed, red for error)
  - Include accessibility attributes and proper semantic markup
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Create CompletionFooter component to replace MessageInput when training ends
  - Create new component file `src/app/components/CompletionFooter.tsx`
  - Implement props interface for status, onStartNewSession, and optional onRetry callbacks
  - Design different layouts for completed vs error states
  - Add appropriate CTAs based on training status
  - _Requirements: 1.2, 1.3, 3.1, 4.2_

- [x] 4. Update main page component state management for training status tracking
  - Add new state variables: trainingStatus, sessionFeedback to `src/app/page.tsx`
  - Update existing handleSendMessage function to process status and feedback from updateTrainingSession response
  - Implement handleStartNewSession function to reset all training-related state
  - Add conditional logic to determine when training is completed or in error state
  - _Requirements: 1.1, 3.2, 3.3, 3.4, 4.1, 5.1, 5.2_

- [x] 5. Implement conditional UI rendering based on training status
  - Update main page render logic in `src/app/page.tsx` to show different components based on trainingStatus
  - Replace MessageInput with CompletionFooter when status is 'completed' or 'error'
  - Add FeedbackPanel display when feedback is available and status is 'completed'
  - Implement TrainingStatusIndicator in appropriate location for ongoing training
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.1, 5.2, 5.3_

- [x] 6. Add error handling and retry functionality for failed training sessions
  - Update handleSendMessage error handling to set trainingStatus to 'error'
  - Implement handleRetry function to attempt message sending again
  - Add error message display logic for different error types
  - Ensure graceful fallback to new session creation for unrecoverable errors
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Update component exports and imports for new components
  - Add new components to `src/app/components/index.ts` barrel export
  - Update imports in `src/app/page.tsx` to include new components
  - Ensure proper TypeScript imports for FeedbackSchema and TrainingStateType
  - _Requirements: All requirements (supporting infrastructure)_

- [ ] 8. Create unit tests for new components
  - Write tests for FeedbackPanel component in `src/app/components/__tests__/FeedbackPanel.test.tsx`
  - Write tests for TrainingStatusIndicator component in `src/app/components/__tests__/TrainingStatusIndicator.test.tsx`
  - Write tests for CompletionFooter component in `src/app/components/__tests__/CompletionFooter.test.tsx`
  - Test component rendering, prop handling, and callback functionality
  - _Requirements: All requirements (quality assurance)_

- [ ] 9. Create integration tests for training completion flow
  - Write integration tests in `src/app/__tests__/training-completion.test.tsx`
  - Test complete training flow from start to completion with feedback display
  - Test error handling and recovery scenarios
  - Test new session creation from completed state
  - Verify UI state transitions work correctly
  - _Requirements: All requirements (end-to-end validation)_
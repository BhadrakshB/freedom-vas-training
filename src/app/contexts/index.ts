// Context exports for clean imports
export { ThemeProvider, useTheme } from './ThemeContext';
export { TrainingProvider, useTraining } from './TrainingContext';
export { ChatLoadingProvider, useChatLoading } from './ChatLoadingContext';

// Type exports
export type { TrainingContextType, TrainingPhase, TrainingUIState, TrainingAction } from './TrainingContext';
export type { ChatLoadingContextType, ChatLoadingState, ChatLoadingType, ChatLoadingAction } from './ChatLoadingContext';
# Design Document

## Overview

This design outlines the migration from custom UI components to shadcn/ui components in the AI Training Simulator. The migration will maintain all existing functionality while improving consistency, accessibility, and maintainability. The project currently uses Next.js 15 with Tailwind CSS 4, which provides a solid foundation for shadcn/ui integration.

## Architecture

### Current Component Structure
The application currently has these main UI components:
- `ChatInterface.tsx` - Main chat component with messages, input, and performance insights
- `FeedbackDisplay.tsx` - Complex feedback display with multiple sections
- `TrainingPanel.tsx` - Training session control panel
- `FeedbackInterface.tsx` - Feedback interface wrapper
- `ProgressIndicator.tsx` - Progress tracking component
- `SessionTimer.tsx` - Timer component
- `TrainingInput.tsx` - Input component for training

### Target Architecture
The migration will follow shadcn/ui patterns:
- **Component Library**: Use shadcn/ui components as building blocks
- **Composition Pattern**: Compose complex components from simpler shadcn/ui primitives
- **Consistent Theming**: Leverage shadcn/ui's CSS variables for consistent theming
- **Accessibility First**: Utilize shadcn/ui's built-in accessibility features

## Components and Interfaces

### 1. Setup and Configuration

#### shadcn/ui Installation
- Install shadcn/ui CLI and initialize configuration
- Configure `components.json` for proper path aliases
- Set up CSS variables for theming
- Ensure compatibility with existing Tailwind CSS 4 setup

#### Required shadcn/ui Components
Based on current component analysis, we need:
- `Button` - For all button interactions
- `Input` - For text inputs and search
- `Card` - For content containers and panels
- `Badge` - For status indicators and tags
- `Alert` - For error and success messages
- `Progress` - For progress indicators
- `Select` - For dropdown selections
- `Textarea` - For multi-line inputs
- `Separator` - For visual separation
- `ScrollArea` - For scrollable content
- `Dialog` - For modal interactions
- `Tabs` - For tabbed interfaces
- `Avatar` - For user representations
- `Skeleton` - For loading states

### 2. Component Migration Strategy

#### ChatInterface Migration
**Current Features:**
- Message display with role-based styling
- Performance insights display
- Suggested actions
- Context selector
- Real-time messaging

**shadcn/ui Implementation:**
- Use `Card` for message containers
- Use `Badge` for role indicators and status
- Use `Button` for suggested actions
- Use `Select` for context selection
- Use `ScrollArea` for message history
- Use `Alert` for performance insights display

#### FeedbackDisplay Migration
**Current Features:**
- Overall performance section with grades
- Detailed analysis with multiple dimensions
- SOP citations
- Actionable recommendations
- Resource links
- Next steps

**shadcn/ui Implementation:**
- Use `Card` for main sections
- Use `Badge` for grades and status indicators
- Use `Progress` for score displays
- Use `Tabs` for organizing different feedback sections
- Use `Alert` for important recommendations
- Use `Separator` for visual organization

#### TrainingPanel Migration
**Current Features:**
- Session status display
- Timer functionality
- Progress tracking
- Scenario information
- Score display
- Input area

**shadcn/ui Implementation:**
- Use `Card` for panel container
- Use `Badge` for status indicators
- Use `Progress` for completion tracking
- Use `Button` for actions
- Use `Input` and `Textarea` for user input
- Use `Alert` for session state messages

### 3. Theming and Styling

#### CSS Variables Integration
- Extend existing CSS variables to work with shadcn/ui
- Maintain current color scheme while adding shadcn/ui semantic colors
- Ensure dark mode compatibility

#### Custom Theme Configuration
```css
:root {
  /* Existing variables */
  --background: #ffffff;
  --foreground: #171717;
  
  /* shadcn/ui semantic variables */
  --card: var(--background);
  --card-foreground: var(--foreground);
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
  --muted: #f8fafc;
  --muted-foreground: #64748b;
  --accent: #f1f5f9;
  --accent-foreground: #0f172a;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #2563eb;
  --radius: 0.5rem;
}
```

## Data Models

### Component Props Interfaces
The migration will maintain existing prop interfaces while adapting them to work with shadcn/ui components:

```typescript
// Enhanced interfaces for shadcn/ui compatibility
interface ChatInterfaceProps {
  userId?: string;
  className?: string;
  onClose?: () => void;
  variant?: 'default' | 'compact' | 'expanded';
}

interface FeedbackDisplayProps {
  feedback: FeedbackOutput;
  sessionId: string;
  className?: string;
  layout?: 'default' | 'tabbed' | 'accordion';
}

interface TrainingPanelProps {
  sessionId?: string;
  onStartSession?: () => void;
  onSendMessage?: (message: string) => void;
  className?: string;
  size?: 'default' | 'compact' | 'expanded';
}
```

## Error Handling

### Error Display Strategy
- Replace custom error displays with shadcn/ui `Alert` components
- Use appropriate alert variants (destructive, warning, info)
- Implement consistent error messaging patterns
- Add proper error boundaries with shadcn/ui components

### Loading States
- Replace custom loading indicators with shadcn/ui `Skeleton` components
- Use consistent loading patterns across all components
- Implement proper loading state management

## Testing Strategy

### Component Testing
- Update existing tests to work with shadcn/ui components
- Test accessibility features provided by shadcn/ui
- Verify responsive behavior across different screen sizes
- Test keyboard navigation and screen reader compatibility

### Visual Regression Testing
- Ensure visual consistency after migration
- Test component variants and states
- Verify theming works correctly in light and dark modes

### Integration Testing
- Test component interactions remain functional
- Verify data flow between migrated components
- Test form submissions and validations

## Migration Phases

### Phase 1: Setup and Basic Components
- Install and configure shadcn/ui
- Migrate simple components (Button, Input, Badge)
- Update basic styling and theming

### Phase 2: Complex Components
- Migrate ChatInterface with shadcn/ui components
- Update TrainingPanel with new component structure
- Implement proper loading and error states

### Phase 3: Advanced Features
- Migrate FeedbackDisplay with tabbed interface
- Implement advanced shadcn/ui features (Dialog, Tabs)
- Add enhanced accessibility features

### Phase 4: Polish and Optimization
- Fine-tune styling and animations
- Optimize bundle size
- Add any missing shadcn/ui enhancements
- Update documentation and examples
// Validation utilities for AI Training Simulator data models

import { 
  ScenarioData, 
  PersonaData, 
  ScoringMetrics, 
  SessionData 
} from './types';

/** Validation functions for core data models */

export function validateScenarioData(data: any): data is ScenarioData {
  return (
    typeof data === 'object' &&
    typeof data.title === 'string' &&
    typeof data.description === 'string' &&
    Array.isArray(data.required_steps) &&
    data.required_steps.every((step: any) => typeof step === 'string') &&
    Array.isArray(data.critical_errors) &&
    data.critical_errors.every((error: any) => typeof error === 'string') &&
    typeof data.time_pressure === 'number'
  );
}

export function validatePersonaData(data: any): data is PersonaData {
  return (
    typeof data === 'object' &&
    typeof data.name === 'string' &&
    typeof data.background === 'string' &&
    Array.isArray(data.personality_traits) &&
    data.personality_traits.every((trait: any) => typeof trait === 'string') &&
    Array.isArray(data.hidden_motivations) &&
    data.hidden_motivations.every((motivation: any) => typeof motivation === 'string') &&
    typeof data.communication_style === 'string' &&
    Array.isArray(data.emotional_arc) &&
    data.emotional_arc.every((emotion: any) => typeof emotion === 'string')
  );
}

export function validateScoringMetrics(data: any): data is ScoringMetrics {
  return (
    typeof data === 'object' &&
    typeof data.policy_adherence === 'number' &&
    typeof data.empathy_index === 'number' &&
    typeof data.completeness === 'number' &&
    typeof data.escalation_judgment === 'number' &&
    typeof data.time_efficiency === 'number' &&
    data.policy_adherence >= 0 && data.policy_adherence <= 100 &&
    data.empathy_index >= 0 && data.empathy_index <= 100 &&
    data.completeness >= 0 && data.completeness <= 100 &&
    data.escalation_judgment >= 0 && data.escalation_judgment <= 100 &&
    data.time_efficiency >= 0 && data.time_efficiency <= 100
  );
}

export function validateSessionData(data: any): data is SessionData {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    validateScenarioData(data.scenario) &&
    validatePersonaData(data.persona) &&
    Array.isArray(data.conversation) &&
    Array.isArray(data.scores) &&
    data.scores.every((score: any) => validateScoringMetrics(score)) &&
    data.startTime instanceof Date &&
    (data.endTime === undefined || data.endTime instanceof Date) &&
    (data.finalFeedback === undefined || typeof data.finalFeedback === 'string')
  );
}

/** Helper functions for creating default instances */

export function createEmptyScenario(): ScenarioData {
  return {
    title: '',
    description: '',
    required_steps: [],
    critical_errors: [],
    time_pressure: 0
  };
}

export function createEmptyPersona(): PersonaData {
  return {
    name: '',
    background: '',
    personality_traits: [],
    hidden_motivations: [],
    communication_style: '',
    emotional_arc: []
  };
}

export function createEmptyScoring(): ScoringMetrics {
  return {
    policy_adherence: 0,
    empathy_index: 0,
    completeness: 0,
    escalation_judgment: 0,
    time_efficiency: 0
  };
}

/** JSON Schema validation for scenario output */

export const SCENARIO_JSON_SCHEMA = {
  type: 'object',
  required: ['title', 'description', 'required_steps', 'critical_errors', 'time_pressure'],
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200
    },
    description: {
      type: 'string',
      minLength: 10,
      maxLength: 2000
    },
    required_steps: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1
      },
      minItems: 1,
      maxItems: 20
    },
    critical_errors: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1
      },
      minItems: 1,
      maxItems: 15
    },
    time_pressure: {
      type: 'number',
      minimum: 1,
      maximum: 10
    }
  },
  additionalProperties: false
} as const;

/** JSON Schema validation for persona output */

export const PERSONA_JSON_SCHEMA = {
  type: 'object',
  required: ['name', 'background', 'personality_traits', 'hidden_motivations', 'communication_style', 'emotional_arc'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    background: {
      type: 'string',
      minLength: 20,
      maxLength: 1000
    },
    personality_traits: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1
      },
      minItems: 2,
      maxItems: 10
    },
    hidden_motivations: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1
      },
      minItems: 1,
      maxItems: 8
    },
    communication_style: {
      type: 'string',
      minLength: 10,
      maxLength: 500
    },
    emotional_arc: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1
      },
      minItems: 2,
      maxItems: 8
    }
  },
  additionalProperties: false
} as const;

/**
 * Validate scenario data against JSON schema
 */
export function validateScenarioAgainstSchema(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  const requiredFields = ['title', 'description', 'required_steps', 'critical_errors', 'time_pressure'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate title
  if (typeof data.title !== 'string' || data.title.length === 0 || data.title.length > 200) {
    errors.push('Title must be a non-empty string with max 200 characters');
  }

  // Validate description
  if (typeof data.description !== 'string' || data.description.length < 10 || data.description.length > 2000) {
    errors.push('Description must be a string between 10 and 2000 characters');
  }

  // Validate required_steps
  if (!Array.isArray(data.required_steps) || data.required_steps.length === 0 || data.required_steps.length > 20) {
    errors.push('Required steps must be an array with 1-20 items');
  } else if (!data.required_steps.every((step: any) => typeof step === 'string' && step.length > 0)) {
    errors.push('All required steps must be non-empty strings');
  }

  // Validate critical_errors
  if (!Array.isArray(data.critical_errors) || data.critical_errors.length === 0 || data.critical_errors.length > 15) {
    errors.push('Critical errors must be an array with 1-15 items');
  } else if (!data.critical_errors.every((error: any) => typeof error === 'string' && error.length > 0)) {
    errors.push('All critical errors must be non-empty strings');
  }

  // Validate time_pressure
  if (typeof data.time_pressure !== 'number' || data.time_pressure < 1 || data.time_pressure > 10) {
    errors.push('Time pressure must be a number between 1 and 10');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate persona data against JSON schema
 */
export function validatePersonaAgainstSchema(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  const requiredFields = ['name', 'background', 'personality_traits', 'hidden_motivations', 'communication_style', 'emotional_arc'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate name
  if (typeof data.name !== 'string' || data.name.length === 0 || data.name.length > 100) {
    errors.push('Name must be a non-empty string with max 100 characters');
  }

  // Validate background
  if (typeof data.background !== 'string' || data.background.length < 20 || data.background.length > 1000) {
    errors.push('Background must be a string between 20 and 1000 characters');
  }

  // Validate personality_traits
  if (!Array.isArray(data.personality_traits) || data.personality_traits.length < 2 || data.personality_traits.length > 10) {
    errors.push('Personality traits must be an array with 2-10 items');
  } else if (!data.personality_traits.every((trait: any) => typeof trait === 'string' && trait.length > 0)) {
    errors.push('All personality traits must be non-empty strings');
  }

  // Validate hidden_motivations
  if (!Array.isArray(data.hidden_motivations) || data.hidden_motivations.length === 0 || data.hidden_motivations.length > 8) {
    errors.push('Hidden motivations must be an array with 1-8 items');
  } else if (!data.hidden_motivations.every((motivation: any) => typeof motivation === 'string' && motivation.length > 0)) {
    errors.push('All hidden motivations must be non-empty strings');
  }

  // Validate communication_style
  if (typeof data.communication_style !== 'string' || data.communication_style.length < 10 || data.communication_style.length > 500) {
    errors.push('Communication style must be a string between 10 and 500 characters');
  }

  // Validate emotional_arc
  if (!Array.isArray(data.emotional_arc) || data.emotional_arc.length < 2 || data.emotional_arc.length > 8) {
    errors.push('Emotional arc must be an array with 2-8 items');
  } else if (!data.emotional_arc.every((emotion: any) => typeof emotion === 'string' && emotion.length > 0)) {
    errors.push('All emotional arc items must be non-empty strings');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
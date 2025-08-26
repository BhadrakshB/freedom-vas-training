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
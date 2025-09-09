import React from 'react';
import { CheckCircle, Clock, AlertCircle, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { TrainingStateType } from '../lib/agents/v2/graph_v2';

interface TrainingStatusIndicatorProps {
  status: TrainingStateType;
  className?: string;
}

const statusConfig = {
  start: {
    icon: Play,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    label: 'Ready to Start',
    ariaLabel: 'Training session ready to start'
  },
  ongoing: {
    icon: Clock,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    label: 'Training in Progress',
    ariaLabel: 'Training session in progress'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50 border-green-200',
    label: 'Training Completed',
    ariaLabel: 'Training session completed successfully'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
    label: 'Training Error',
    ariaLabel: 'Training session encountered an error'
  }
} as const;

export function TrainingStatusIndicator({ status, className }: TrainingStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium',
        config.color,
        className
      )}
      role="status"
      aria-label={config.ariaLabel}
    >
      <Icon 
        className="h-4 w-4" 
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </div>
  );
}
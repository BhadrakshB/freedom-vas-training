import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrainingStatusIndicator } from '../TrainingStatusIndicator';
import { TrainingStateType } from '@/app/lib/agents/v2/graph_v2';

describe('TrainingStatusIndicator', () => {
  it('renders start status correctly', () => {
    render(<TrainingStatusIndicator status="start" />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('aria-label', 'Training session ready to start');
    expect(screen.getByText('Ready to Start')).toBeInTheDocument();
  });

  it('renders ongoing status correctly', () => {
    render(<TrainingStatusIndicator status="ongoing" />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('aria-label', 'Training session in progress');
    expect(screen.getByText('Training in Progress')).toBeInTheDocument();
  });

  it('renders completed status correctly', () => {
    render(<TrainingStatusIndicator status="completed" />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('aria-label', 'Training session completed successfully');
    expect(screen.getByText('Training Completed')).toBeInTheDocument();
  });

  it('renders error status correctly', () => {
    render(<TrainingStatusIndicator status="error" />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('aria-label', 'Training session encountered an error');
    expect(screen.getByText('Training Error')).toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    render(<TrainingStatusIndicator status="ongoing" className="custom-class" />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('custom-class');
  });

  it('has proper color coding for each status', () => {
    const { rerender } = render(<TrainingStatusIndicator status="start" />);
    let indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('text-blue-600', 'bg-blue-50', 'border-blue-200');

    rerender(<TrainingStatusIndicator status="ongoing" />);
    indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('text-blue-600', 'bg-blue-50', 'border-blue-200');

    rerender(<TrainingStatusIndicator status="completed" />);
    indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('text-green-600', 'bg-green-50', 'border-green-200');

    rerender(<TrainingStatusIndicator status="error" />);
    indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('text-red-600', 'bg-red-50', 'border-red-200');
  });

  it('includes proper accessibility attributes', () => {
    render(<TrainingStatusIndicator status="completed" />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label');
    
    // Icon should be hidden from screen readers
    const icon = indicator.querySelector('svg');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
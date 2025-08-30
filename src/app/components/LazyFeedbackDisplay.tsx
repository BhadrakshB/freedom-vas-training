'use client';

import React, { Suspense, lazy } from 'react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';

// Lazy load the FeedbackDisplay component
const FeedbackDisplay = lazy(() => import('./FeedbackDisplay').then(module => ({ default: module.FeedbackDisplay })));

// Loading component for FeedbackDisplay
const FeedbackDisplaySkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </CardContent>
  </Card>
);

// Import the correct interface from types
import { FeedbackOutput } from '../lib/types';

interface LazyFeedbackDisplayProps {
  feedback: FeedbackOutput;
  sessionId: string;
  className?: string;
}

export const LazyFeedbackDisplay: React.FC<LazyFeedbackDisplayProps> = (props) => {
  return (
    <Suspense fallback={<FeedbackDisplaySkeleton />}>
      <FeedbackDisplay {...props} />
    </Suspense>
  );
};
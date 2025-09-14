"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

import { getUserThreadsByFirebaseUid, type UserThread } from "../lib/actions/user-threads-actions";

interface UserThreadsListProps {
  className?: string;
  onThreadSelect?: (thread: UserThread) => void;
}

export function UserThreadsList({ 
  className, 
  onThreadSelect
}: UserThreadsListProps) {
  const { state: authState } = useAuth();
  
  const [threads, setThreads] = useState<UserThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    paused: 0
  });

  // Load threads when user authenticates
  const loadThreads = useCallback(async () => {
    if (!authState.user?.uid) {
      setThreads([]);
      setStats({ total: 0, active: 0, completed: 0, paused: 0 });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserThreadsByFirebaseUid(authState.user.uid);
      
      if (result.success) {
        setThreads(result.threads);
        setStats({
          total: result.totalCount,
          active: result.activeCount,
          completed: result.completedCount,
          paused: result.totalCount - result.activeCount - result.completedCount
        });
      } else {
        setError(result.error || 'Failed to load threads');
        setThreads([]);
        setStats({ total: 0, active: 0, completed: 0, paused: 0 });
      }
    } catch (err) {
      console.error('Error loading threads:', err);
      setError('Failed to load conversations');
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [authState.user?.uid]);

  // Load threads on mount and when user changes
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);



  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };



  if (!authState.user) {
    return (
      <div className={cn("space-y-2", className)}>
        <h3 className="text-sm font-medium text-muted-foreground">
          Conversations
        </h3>
        <div className="text-sm text-muted-foreground text-center py-8">
          Sign in to view your conversations
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col min-h-0 h-full", className)}>
      {/* Simple header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">Recent</span>
        <span className="text-xs text-muted-foreground">{stats.total}</span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-xs text-muted-foreground">Loading...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-4">
          <div className="text-xs text-red-600 mb-2">{error}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadThreads}
            className="h-6 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Threads List */}
      {!isLoading && !error && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          {threads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-xs text-muted-foreground">
                No conversations yet
              </div>
            </div>
          ) : (
            <div className="space-y-1 pr-1">
              {threads.map((thread) => {
                const statusColor = 
                  thread.status === 'active' ? 'bg-green-500' :
                  thread.status === 'completed' ? 'bg-blue-500' :
                  'bg-gray-400';
                
                return (
                  <button
                    key={thread.id}
                    onClick={() => onThreadSelect?.(thread)}
                    className="w-full text-left p-2 rounded hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", statusColor)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate group-hover:text-foreground">
                          {thread.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(thread.lastActivity || thread.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
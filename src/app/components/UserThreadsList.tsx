"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Clock, CheckCircle, Play, Pause, Calendar, Filter, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useCoreAppData } from "../contexts/CoreAppDataContext";
import { getUserThreadsByFirebaseUid, getUserThreadsByStatus, type UserThread } from "../lib/actions/user-threads-actions";

interface UserThreadsListProps {
  className?: string;
  onThreadSelect?: (thread: UserThread) => void;
  showSearch?: boolean;
}

type ThreadFilter = 'all' | 'active' | 'completed' | 'paused';

export function UserThreadsList({ 
  className, 
  onThreadSelect, 
  showSearch = true
}: UserThreadsListProps) {
  const { state: authState } = useAuth();
  const { state: coreState } = useCoreAppData();
  
  const [threads, setThreads] = useState<UserThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<UserThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<ThreadFilter>('all');
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
      setFilteredThreads([]);
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
      setError('Failed to load training sessions');
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [authState.user?.uid]);

  // Load threads on mount and when user changes
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Filter and search threads
  useEffect(() => {
    let filtered = threads;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(thread => thread.status === filter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(thread =>
        thread.title.toLowerCase().includes(search) ||
        (thread.scenario && 
         typeof thread.scenario === 'object' && 
         'scenario_title' in thread.scenario &&
         String(thread.scenario.scenario_title).toLowerCase().includes(search))
      );
    }

    setFilteredThreads(filtered);
  }, [threads, filter, searchTerm]);

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

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: Play,
          color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
          text: 'Active'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
          text: 'Completed'
        };
      case 'paused':
        return {
          icon: Pause,
          color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
          text: 'Paused'
        };
      default:
        return {
          icon: MessageSquare,
          color: 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300',
          text: status
        };
    }
  };

  if (!authState.user) {
    return (
      <div className={cn("space-y-2", className)}>
        <h3 className="text-sm font-medium text-muted-foreground">
          Training Sessions
        </h3>
        <div className="text-sm text-muted-foreground text-center py-8">
          Sign in to view your training sessions
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col min-h-0 h-full", className)}>
      {/* Header with stats */}
      <div className="flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Training Sessions
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadThreads}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Stats - Responsive layout */}
        <div className="flex flex-wrap gap-1 text-xs">
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {stats.total}
          </Badge>
          {stats.active > 0 && (
            <Badge variant="outline" className="text-xs text-green-600 px-1.5 py-0.5">
              {stats.active} Active
            </Badge>
          )}
          {stats.completed > 0 && (
            <Badge variant="outline" className="text-xs text-blue-600 px-1.5 py-0.5">
              {stats.completed} Done
            </Badge>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      {showSearch && threads.length > 0 && (
        <div className="flex-shrink-0 space-y-2 mt-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
          </div>
          
          <Select value={filter} onValueChange={(value: ThreadFilter) => setFilter(value)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Done</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Loading...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-2">
          <div className="text-xs text-red-600 text-center">{error}</div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadThreads}
            className="h-7 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Threads List - Takes remaining space */}
      {!isLoading && !error && (
        <div className="flex-1 min-h-0 mt-3">
          <ScrollArea className="h-full w-full">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <div className="text-xs text-muted-foreground">
                  {searchTerm || filter !== 'all' 
                    ? 'No matches'
                    : 'No sessions yet'
                  }
                </div>
                {!searchTerm && filter === 'all' && (
                  <div className="text-xs text-muted-foreground mt-1 opacity-70">
                    Start training to see sessions
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 pr-2">
                {filteredThreads.map((thread, index) => {
                  const statusDisplay = getStatusDisplay(thread.status);
                  const StatusIcon = statusDisplay.icon;
                  
                  return (
                    <div key={thread.id}>
                      <button
                        onClick={() => onThreadSelect?.(thread)}
                        className="w-full text-left p-2 rounded-md border hover:bg-accent transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className={cn("h-3 w-3 shrink-0", statusDisplay.color.split(' ')[0])} />
                              <h4 className="text-xs font-medium truncate">
                                {thread.title}
                              </h4>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-2.5 w-2.5" />
                              <span className="text-xs">
                                {formatDate(thread.lastActivity || thread.updatedAt)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="shrink-0">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              statusDisplay.color.includes('green') ? 'bg-green-500' :
                              statusDisplay.color.includes('blue') ? 'bg-blue-500' :
                              statusDisplay.color.includes('yellow') ? 'bg-yellow-500' :
                              'bg-gray-500'
                            )} />
                          </div>
                        </div>
                      </button>
                      
                      {index < filteredThreads.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
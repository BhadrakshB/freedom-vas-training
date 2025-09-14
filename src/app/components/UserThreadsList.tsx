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
  maxHeight?: string;
}

type ThreadFilter = 'all' | 'active' | 'completed' | 'paused';

export function UserThreadsList({ 
  className, 
  onThreadSelect, 
  showSearch = true,
  maxHeight = "400px"
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
    <div className={cn("space-y-4", className)}>
      {/* Header with stats */}
      <div className="space-y-2">
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
        
        {/* Stats */}
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className="text-xs">
            {stats.total} Total
          </Badge>
          {stats.active > 0 && (
            <Badge variant="outline" className="text-xs text-green-600">
              {stats.active} Active
            </Badge>
          )}
          {stats.completed > 0 && (
            <Badge variant="outline" className="text-xs text-blue-600">
              {stats.completed} Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      {showSearch && threads.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          
          <Select value={filter} onValueChange={(value: ThreadFilter) => setFilter(value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="active">Active ({stats.active})</SelectItem>
              <SelectItem value="completed">Completed ({stats.completed})</SelectItem>
              <SelectItem value="paused">Paused ({stats.paused})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-6">
          <div className="text-sm text-muted-foreground">Loading sessions...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-6">
          <div className="text-sm text-red-600">{error}</div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadThreads}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Threads List */}
      {!isLoading && !error && (
        <ScrollArea className={`w-full`} style={{ maxHeight }}>
          {filteredThreads.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-sm text-muted-foreground">
                {searchTerm || filter !== 'all' 
                  ? 'No sessions match your criteria'
                  : 'No training sessions yet'
                }
              </div>
              {!searchTerm && filter === 'all' && (
                <div className="text-xs text-muted-foreground mt-1">
                  Start a new training session to see it here
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredThreads.map((thread, index) => {
                const statusDisplay = getStatusDisplay(thread.status);
                const StatusIcon = statusDisplay.icon;
                
                return (
                  <div key={thread.id}>
                    <button
                      onClick={() => onThreadSelect?.(thread)}
                      className="w-full text-left p-3 rounded-md border hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={cn("h-3 w-3 shrink-0", statusDisplay.color.split(' ')[0])} />
                            <h4 className="text-sm font-medium truncate">
                              {thread.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(thread.lastActivity || thread.updatedAt)}</span>
                          </div>
                        </div>
                        
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs shrink-0", statusDisplay.color)}
                        >
                          {statusDisplay.text}
                        </Badge>
                      </div>
                    </button>
                    
                    {index < filteredThreads.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
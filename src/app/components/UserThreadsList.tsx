"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useCoreAppData } from "../contexts/CoreAppDataContext";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Check,
  X,
  Square,
} from "lucide-react";
import type { UserThread } from "../lib/actions/user-threads-actions";
import type {
  ThreadGroupWithThreads,
  ThreadWithMessages,
} from "../contexts/CoreAppDataContext";

interface UserThreadsListProps {
  className?: string;
  onThreadSelect?: (id: string | null) => void;
  selectedThreadId?: string | null;
}

export function UserThreadsList({
  className,
  onThreadSelect,
  selectedThreadId,
}: UserThreadsListProps) {
  const { state: authState } = useAuth();
  const coreAppData = useCoreAppData();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [endingGroupIds, setEndingGroupIds] = useState<Set<string>>(new Set());

  // Use data from CoreAppDataContext
  const {
    state: {
      userThreads,
      threadStats,
      isLoadingThreads,
      error,
      settings: {},
      threadGroups,
      isLoadingGroups,
    },
    toggleGroupExpansion,
    createNewThreadGroup,
    assignThreadToGroup,
    selectUserThread,
  } = coreAppData;

  const isLoading = isLoadingThreads || isLoadingGroups;

  // Group threads locally based on their groupId
  const groupedThreads = React.useMemo(() => {
    return threadGroups.map((group) => ({
      ...group,
      threads: userThreads.filter(
        (thread) => thread.thread.groupId === group.threadGroup.id
      ),
    }));
  }, [threadGroups, userThreads]);

  // Get ungrouped threads (threads without a groupId)
  const ungroupedThreads = React.useMemo(() => {
    return userThreads.filter((thread) => !thread.thread.groupId);
  }, [userThreads]);

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  // Handle creating a new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      await createNewThreadGroup(newGroupName.trim());
      setNewGroupName("");
      setShowCreateGroup(false);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Handle canceling group creation
  const handleCancelCreateGroup = () => {
    setNewGroupName("");
    setShowCreateGroup(false);
  };

  // Handle thread selection
  const handleThreadSelect = async (thread: ThreadWithMessages) => {
    // Call selectUserThread to fetch messages if needed
    await selectUserThread(thread.thread.id);
    // Also call the optional callback
    onThreadSelect?.(thread.thread.id);
  };

  // Handle ending all threads in a group
  const handleEndGroupTraining = async (groupId: string) => {
    setEndingGroupIds((prev) => new Set(prev).add(groupId));

    try {
      // Call the context function to handle ending all threads with AI feedback
      await coreAppData.handleEndBulkTraining(groupId);
    } catch (error) {
      console.error("Error ending group training:", error);
    } finally {
      setEndingGroupIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  // Render a single thread item
  const renderThread = (thread: ThreadWithMessages, isInGroup = false) => {
    const statusColor =
      thread.thread.status === "active"
        ? "bg-green-500"
        : thread.thread.status === "completed"
        ? "bg-blue-500"
        : "bg-gray-400";

    const isSelected = selectedThreadId === thread.thread.id;

    return (
      <button
        key={thread.thread.id}
        onClick={() => handleThreadSelect(thread)}
        className={cn(
          "w-full text-left p-2 rounded transition-colors group",
          isInGroup && "ml-4",
          isSelected
            ? "bg-primary/10 border border-primary/20 hover:bg-primary/15"
            : "hover:bg-accent/50"
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", statusColor)} />
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-xs font-medium truncate group-hover:text-foreground",
                isSelected && "text-primary font-semibold"
              )}
            >
              {thread.thread.title}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(thread.thread.updatedAt)}
            </div>
          </div>
        </div>
      </button>
    );
  };

  // Render a thread group
  const renderThreadGroup = (group: ThreadGroupWithThreads) => {
    const isExpanded = group.isExpanded ?? true;
    const hasActiveThreads = group.threads.some(
      (thread) => thread.thread.status === "active"
    );
    const isEndingGroup = endingGroupIds.has(group.threadGroup.id);

    return (
      <div key={group.threadGroup.id} className="space-y-1">
        {/* Group Header */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              toggleGroupExpansion(group.threadGroup.id, !isExpanded)
            }
            className="flex-1 flex items-center gap-2 p-2 rounded hover:bg-accent/50 transition-colors group"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Folder className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
              {group.threadGroup.groupName}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {group.threads.length}
            </span>
          </button>

          {/* End Training Button */}
          {hasActiveThreads && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleEndGroupTraining(group.threadGroup.id);
              }}
              disabled={isEndingGroup}
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
            >
              <Square className="h-3 w-3 mr-1" />
              {isEndingGroup ? "Ending..." : "End"}
            </Button>
          )}
        </div>

        {/* Group Threads */}
        {isExpanded && (
          <div className="space-y-1">
            {group.threads.map((thread) => renderThread(thread, true))}
          </div>
        )}
      </div>
    );
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">
          {"Conversations"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {threadStats.total}
          </span>
          {
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateGroup(true)}
              className="h-5 w-5 p-0 hover:bg-accent"
              disabled={showCreateGroup}
            >
              <Plus className="h-3 w-3" />
            </Button>
          }
        </div>
      </div>

      {/* Create Group Input */}
      {showCreateGroup && (
        <div className="mb-3 p-2 border rounded-md bg-accent/20">
          <div className="flex items-center gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className="h-6 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
                if (e.key === "Escape") handleCancelCreateGroup();
              }}
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isCreatingGroup}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelCreateGroup}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

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
            onClick={() => coreAppData.loadUserThreads()}
            className="h-6 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Threads List */}
      {!isLoading && !error && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          {userThreads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-xs text-muted-foreground">
                No conversations yet
              </div>
            </div>
          ) : (
            <div className="space-y-1 pr-1">
              {
                <>
                  {/* Grouped Threads */}
                  {groupedThreads.map(renderThreadGroup)}

                  {/* Ungrouped Threads */}
                  {ungroupedThreads.length > 0 && (
                    <div className="space-y-1">
                      {ungroupedThreads.length > 0 &&
                        groupedThreads.length > 0 && (
                          <div className="text-xs font-medium text-muted-foreground pt-2 pb-1">
                            Ungrouped
                          </div>
                        )}
                      {ungroupedThreads.map((thread) => renderThread(thread))}
                    </div>
                  )}
                </>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

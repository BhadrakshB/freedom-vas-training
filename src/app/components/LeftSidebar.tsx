"use client";

import React, { useState, useCallback } from "react";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { AuthStatus } from "./AuthStatus";
import { UserThreadsList } from "./UserThreadsList";
import { useAuth } from "../contexts/AuthContext";
import { useCoreAppData } from "../contexts/CoreAppDataContext";
import type { UserThread } from "../lib/actions/user-threads-actions";

interface LeftSidebarProps {
  children?: React.ReactNode;
  className?: string;
  onThreadSelect?: (id: string | null) => void;
  selectedThreadId?: string | null;
}

export function LeftSidebar({
  children,
  className,
  onThreadSelect,
  selectedThreadId,
}: LeftSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { state: authState } = useAuth();
  const {
    state: {},
  } = useCoreAppData();

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-3 left-3 z-50 h-8 w-8 p-0"
        onClick={toggleMobile}
      >
        {isMobileOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <Menu className="h-4 w-4" />
        )}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r border-border/50 transition-all duration-200 z-50",
          // Desktop behavior
          "lg:relative lg:z-auto",
          isCollapsed ? "lg:w-12" : "lg:w-72", // Keep 48px width when collapsed for button
          // Mobile behavior
          isMobileOpen
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={cn(
              "border-b border-border/30",
              isCollapsed
                ? "flex flex-col items-center p-2 space-y-2"
                : "flex items-center justify-between p-3"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobile}
              className="lg:hidden h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>

            {/* Desktop toggle button - positioned inside sidebar */}
            <Button
              variant={isCollapsed ? "default" : "ghost"}
              size="sm"
              className={cn(
                "hidden lg:flex h-8 w-8 p-0",
                isCollapsed
                  ? "bg-primary hover:bg-primary/90 shadow-sm"
                  : "ml-auto"
              )}
              onClick={toggleCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-primary-foreground" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>

            {/* Collapsed state user avatar - right below ChevronRight */}
            {isCollapsed && authState.user && (
              <div
                className="hidden lg:flex cursor-pointer"
                onClick={toggleCollapsed}
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-xs font-medium">
                    {(
                      authState.user?.displayName ||
                      authState.user?.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Messages CTA icon - below avatar */}
            {isCollapsed && (
              <Button
                variant="default"
                size="sm"
                className="hidden lg:flex h-8 w-8 p-0 bg-primary hover:bg-primary/90 shadow-sm"
                onClick={toggleCollapsed}
              >
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div
            className={cn(
              "flex-1 overflow-y-auto scrollbar-hide p-3 space-y-4 transition-opacity duration-200",
              isCollapsed &&
                "lg:opacity-0 lg:pointer-events-none lg:overflow-hidden"
            )}
          >
            {/* Auth Section */}
            <AuthStatus />
            {/* Thread Group Manager
            {authState.user && (
              <div className="pb-2">
                <ThreadGroupManager />
              </div>
            )} */}
            {/* Threads Section */}
            {authState.user && (
              <UserThreadsList
                onThreadSelect={onThreadSelect}
                selectedThreadId={selectedThreadId}
              />
            )}
            {children}
          </div>
        </div>
      </aside>
    </>
  );
}

// Export hook for controlling sidebar from parent components
export function useLeftSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

"use client";

import React, { useState, useCallback } from "react";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { AuthStatus } from "./AuthStatus";
import { UserThreadsList } from "./UserThreadsList";
import { useAuth } from "../contexts/AuthContext";
import type { UserThread } from "../lib/actions/user-threads-actions";

interface LeftSidebarProps {
  children?: React.ReactNode;
  className?: string;
  onThreadSelect?: (thread: UserThread) => void;
}

export function LeftSidebar({
  children,
  className,
  onThreadSelect,
}: LeftSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { state: authState } = useAuth();

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

      {/* Desktop toggle button - positioned outside sidebar */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "hidden lg:flex fixed top-3 z-40 h-8 w-8 p-0 transition-all duration-200",
          isCollapsed ? "left-3" : "left-[276px]"
        )}
        onClick={toggleCollapsed}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
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
          isCollapsed ? "lg:w-0 lg:border-r-0" : "lg:w-72",
          // Mobile behavior
          isMobileOpen
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full lg:translate-x-0",
          // Hide content when collapsed on desktop
          isCollapsed && "lg:overflow-hidden",
          className
        )}
      >
        <div
          className={cn(
            "flex flex-col h-full transition-opacity duration-200",
            isCollapsed && "lg:opacity-0 lg:pointer-events-none"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobile}
              className="lg:hidden h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-4">
            {/* Auth Section */}
            <AuthStatus />

            {/* Threads Section */}
            {authState.user && (
              <UserThreadsList onThreadSelect={onThreadSelect} />
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

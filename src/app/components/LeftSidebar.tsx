"use client";

import React, { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { AuthStatus } from "./AuthStatus";
import { UserThreadsList } from "./UserThreadsList";
import { useAuth } from "../contexts/AuthContext";

interface LeftSidebarProps {
  children?: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export function LeftSidebar({ 
  children, 
  defaultCollapsed = false, 
  className 
}: LeftSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { state: authState } = useAuth();

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Mobile overlay when open
  const mobileOverlay = isMobileOpen && (
    <div 
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={closeMobile}
      aria-hidden="true"
    />
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOverlay}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-r transition-all duration-300 z-50",
          // Desktop behavior
          "lg:relative lg:z-auto",
          isCollapsed ? "lg:w-16" : "lg:w-80",
          // Mobile behavior
          isMobileOpen ? "w-80 translate-x-0" : "w-80 -translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Header with collapse/expand button */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className={cn(
            "flex items-center gap-2 transition-opacity duration-200",
            isCollapsed && "lg:opacity-0 lg:invisible"
          )}>
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">STR</span>
            </div>
            <span className="font-semibold text-sm">Training Assistant</span>
          </div>
          
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="hidden lg:flex h-8 w-8 p-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={closeMobile}
            className="lg:hidden h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar content */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Authentication Status Section */}
              <div className={cn(
                "transition-opacity duration-200",
                isCollapsed && "lg:opacity-0 lg:invisible"
              )}>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Authentication
                  </h3>
                  <AuthStatus />
                </div>
              </div>

              {/* User Threads Section - Only show when authenticated */}
              {authState.user && (
                <div className={cn(
                  "transition-opacity duration-200",
                  isCollapsed && "lg:opacity-0 lg:invisible"
                )}>
                  <UserThreadsList />
                </div>
              )}

              {/* Collapsed state indicators */}
              {isCollapsed && (
                <div className="hidden lg:flex flex-col items-center space-y-4 pt-4">
                  {/* Auth status indicator */}
                  <div 
                    className={cn(
                      "w-3 h-3 rounded-full border-2",
                      authState.user 
                        ? "bg-green-500 border-green-500" 
                        : "bg-gray-500 border-gray-500"
                    )}
                    title={authState.user ? "Authenticated" : "Not authenticated"}
                  />
                  
                  {/* Threads count indicator */}
                  {authState.user && (
                    <div 
                      className="w-8 h-6 bg-primary rounded text-primary-foreground text-xs flex items-center justify-center font-medium"
                      title="Training sessions"
                    >
                      {/* This will be populated by UserThreadsList */}
                    </div>
                  )}
                </div>
              )}

              {/* Additional content */}
              {children}
            </div>
          </div>

          {/* Footer */}
          <div className={cn(
            "p-4 border-t transition-opacity duration-200",
            isCollapsed && "lg:opacity-0 lg:invisible"
          )}>
            <div className="text-xs text-muted-foreground text-center">
              STR Training Assistant v1.0
            </div>
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
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    open,
    close,
    toggle
  };
}
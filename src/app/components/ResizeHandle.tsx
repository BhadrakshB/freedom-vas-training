"use client";

import React, { forwardRef } from "react";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

export const ResizeHandle = forwardRef<HTMLDivElement, ResizeHandleProps>(
  ({ onMouseDown, isResizing }, ref) => {
    return (
      <div
        ref={ref}
        className={`w-1 cursor-col-resize transition-all relative group ${
          isResizing ? "bg-primary w-2" : "bg-border hover:bg-primary/50"
        }`}
        onMouseDown={onMouseDown}
      >
        <div
          className={`absolute inset-y-0 -left-2 -right-2 transition-colors ${
            isResizing ? "bg-primary/30" : "group-hover:bg-primary/10"
          }`}
        />

        {/* Visual grip dots */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col gap-1">
            <div className="w-0.5 h-0.5 bg-muted-foreground rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-muted-foreground rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-muted-foreground rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
);

ResizeHandle.displayName = "ResizeHandle";

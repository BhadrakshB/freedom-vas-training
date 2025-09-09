"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { cn } from "@/app/lib/utils";

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  ctaText?: string;
}

export function CollapsiblePanel({
  title,
  children,
  className,
  defaultOpen = false,
  ctaText,
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full", className)}
    >
      <Card className={cn(
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border shadow-lg transition-all duration-300 ease-in-out m-0",
        isOpen ? "p-0" : "p-0"
      )}>
        {/* Collapsed State - Single Line CTA */}
        {!isOpen && (
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer hover:bg-accent/50 transition-all duration-200 rounded-lg group border-l-2 border-l-transparent hover:border-l-primary/50">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {ctaText && (
                    <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary/70 transition-colors">
                      {ctaText}
                    </p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:scale-110" />
              </div>
            </div>
          </CollapsibleTrigger>
        )}

        {/* Expanded State - Full Content */}
        {isOpen && (
          <div className="p-4">
            <CardHeader className="pb-3 p-0">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {title}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-accent hover:text-primary transition-colors"
                    aria-label={`Collapse ${title} panel`}
                  >
                    <ChevronUp className="h-4 w-4 transition-transform hover:scale-110" />
                  </Button>
                </CollapsibleTrigger>
              </CardTitle>
            </CardHeader>
            <CollapsibleContent className="transition-all duration-300 ease-in-out">
              <CardContent className="pt-3 p-0">{children}</CardContent>
            </CollapsibleContent>
          </div>
        )}
      </Card>
    </Collapsible>
  );
}
"use client";

import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trash2, Plus } from "lucide-react";

export interface SessionConfiguration {
  id: string;
  title: string;
  scenario?: string;
  persona?: string;
}

export interface BulkSessionGroup {
  groupName: string;
}

interface BulkSessionCreationProps {
  show: boolean;
  sessionCount: number;
  sessionConfigurations: SessionConfiguration[];
  groupName: string;
  isCreatingBulkSessions: boolean;
  onClose: () => void;
  onSessionCountChange: (count: number) => void;
  onConfigurationChange: (
    id: string,
    field: keyof SessionConfiguration,
    value: string
  ) => void;
  onRemoveConfiguration: (id: string) => void;
  onAddConfiguration: () => void;
  onGroupNameChange: (groupName: string) => void;
  onStartAllSessions: () => void;
}

export function BulkSessionCreation({
  show,
  sessionCount,
  sessionConfigurations,
  groupName,
  isCreatingBulkSessions,
  onClose,
  onSessionCountChange,
  onConfigurationChange,
  onRemoveConfiguration,
  onAddConfiguration,
  onGroupNameChange,
  onStartAllSessions,
}: BulkSessionCreationProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Create Multiple Training Sessions
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isCreatingBulkSessions}
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Group Name Input */}
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => onGroupNameChange(e.target.value)}
                placeholder="Enter a name for this training group"
                disabled={isCreatingBulkSessions}
              />
              <p className="text-sm text-muted-foreground">
                All sessions will be grouped together under this name for easy
                organization.
              </p>
            </div>

            {/* Session Count Input */}
            <div className="space-y-2">
              <Label htmlFor="sessionCount">Number of Sessions</Label>
              <Input
                id="sessionCount"
                type="number"
                min="1"
                max="20"
                value={sessionCount}
                onChange={(e) =>
                  onSessionCountChange(parseInt(e.target.value) || 1)
                }
                disabled={isCreatingBulkSessions}
              />
            </div>

            {/* Session Configurations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Session Configurations</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddConfiguration}
                  disabled={isCreatingBulkSessions}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Session
                </Button>
              </div>

              <div className="grid gap-4">
                {sessionConfigurations.map((config, index) => (
                  <Card key={config.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Session {index + 1}
                        </CardTitle>
                        {sessionConfigurations.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveConfiguration(config.id)}
                            disabled={isCreatingBulkSessions}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`title-${config.id}`}>
                          Session Title
                        </Label>
                        <Input
                          id={`title-${config.id}`}
                          value={config.title}
                          onChange={(e) =>
                            onConfigurationChange(
                              config.id,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="Enter session title"
                          disabled={isCreatingBulkSessions}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`scenario-${config.id}`}>
                          Custom Scenario (Optional)
                        </Label>
                        <textarea
                          id={`scenario-${config.id}`}
                          className="w-full min-h-[80px] p-3 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          value={config.scenario}
                          onChange={(e) =>
                            onConfigurationChange(
                              config.id,
                              "scenario",
                              e.target.value
                            )
                          }
                          placeholder="Leave blank for AI-generated scenario or enter custom scenario details..."
                          disabled={isCreatingBulkSessions}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`persona-${config.id}`}>
                          Custom Persona (Optional)
                        </Label>
                        <textarea
                          id={`persona-${config.id}`}
                          className="w-full min-h-[80px] p-3 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          value={config.persona}
                          onChange={(e) =>
                            onConfigurationChange(
                              config.id,
                              "persona",
                              e.target.value
                            )
                          }
                          placeholder="Leave blank for AI-generated persona or enter custom persona details..."
                          disabled={isCreatingBulkSessions}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sessionConfigurations.length} session
              {sessionConfigurations.length !== 1 ? "s" : ""} will be created
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isCreatingBulkSessions}
              >
                Cancel
              </Button>
              <Button
                onClick={onStartAllSessions}
                disabled={
                  isCreatingBulkSessions || sessionConfigurations.length === 0
                }
              >
                {isCreatingBulkSessions
                  ? "Creating Sessions..."
                  : `Create All ${sessionConfigurations.length} Sessions`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { useCoreAppData } from "../contexts/CoreAppDataContext";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import type { ThreadGroup } from "../contexts/CoreAppDataContext";

interface ThreadGroupManagerProps {
  className?: string;
}

export function ThreadGroupManager({ className }: ThreadGroupManagerProps) {
  const {
    state: { threadGroups, isLoadingGroups },
    createNewThreadGroup,
    updateThreadGroupData,
    deleteThreadGroupData,
  } = useCoreAppData();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ThreadGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle creating a new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsSubmitting(true);
    try {
      await createNewThreadGroup(newGroupName.trim());
      setNewGroupName("");
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing a group
  const handleEditGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;

    setIsSubmitting(true);
    try {
      await updateThreadGroupData(editingGroup.id, {
        groupName: newGroupName.trim(),
      });
      setNewGroupName("");
      setEditingGroup(null);
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a group
  const handleDeleteGroup = async (group: ThreadGroup) => {
    if (
      !confirm(
        `Are you sure you want to delete the group "${group.groupName}"? Threads in this group will become ungrouped.`
      )
    ) {
      return;
    }

    try {
      await deleteThreadGroupData(group.id);
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  // Start editing a group
  const startEditGroup = (group: ThreadGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.groupName);
    setShowEditDialog(true);
  };

  return (
    <div className={className}>
      {/* Trigger Button */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 w-full">
            <Settings className="w-4 h-4" />
            Manage Groups
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Thread Groups</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create New Group Section */}
            <div className="space-y-2">
              <Label htmlFor="new-group-name">Create New Group</Label>
              <div className="flex gap-2">
                <Input
                  id="new-group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateGroup();
                  }}
                />
                <Button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || isSubmitting}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Existing Groups */}
            <div className="space-y-2">
              <Label>Existing Groups</Label>
              {isLoadingGroups ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Loading groups...
                </div>
              ) : threadGroups.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No groups created yet
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {threadGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-2 rounded border bg-accent/20"
                    >
                      <span className="text-sm font-medium">
                        {group.groupName}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => startEditGroup(group)}
                          title="Edit group"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteGroup(group)}
                          title="Delete group"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditGroup();
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingGroup(null);
                setNewGroupName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditGroup}
              disabled={!newGroupName.trim() || isSubmitting}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

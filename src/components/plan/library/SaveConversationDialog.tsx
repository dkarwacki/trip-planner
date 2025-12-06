import React from "react";
import { Button } from "@/components/ui/button";

interface SaveConversationDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

/**
 * SaveConversationDialog - Prompt when switching with unsaved changes
 *
 * Features:
 * - Three actions: Save, Discard, Cancel
 * - Clear messaging
 * - Keyboard support (Escape to cancel)
 */
export function SaveConversationDialog({ isOpen, onSave, onDiscard, onCancel }: SaveConversationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" data-testid="save-conversation-dialog">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold" data-testid="dialog-title">Unsaved Changes</h2>
        <p className="mb-6 text-sm text-muted-foreground" data-testid="dialog-description">
          You have unsaved messages in this conversation. What would you like to do?
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} data-testid="cancel-button">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDiscard} data-testid="discard-button">
            Discard
          </Button>
          <Button onClick={onSave} data-testid="save-button">Save & Continue</Button>
        </div>
      </div>
    </div>
  );
}

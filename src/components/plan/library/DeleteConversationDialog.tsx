import React from "react";
import { Button } from "@/components/ui/button";

interface DeleteConversationDialogProps {
  isOpen: boolean;
  conversationTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteConversationDialog - Confirmation for deleting a conversation
 *
 * Features:
 * - Clear warning
 * - Shows conversation title
 * - Destructive action styling
 */
export function DeleteConversationDialog({
  isOpen,
  conversationTitle,
  onConfirm,
  onCancel,
}: DeleteConversationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" data-testid="delete-conversation-dialog">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold" data-testid="dialog-title">Delete Conversation?</h2>
        <p className="mb-6 text-sm text-muted-foreground" data-testid="dialog-description">
          Are you sure you want to delete <strong>{conversationTitle}</strong>? This action cannot be undone.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} data-testid="cancel-button">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} data-testid="confirm-delete-button">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

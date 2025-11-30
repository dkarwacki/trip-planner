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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold">Delete Conversation?</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{conversationTitle}</strong>? This action cannot be undone.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

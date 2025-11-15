import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewConversationButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * NewConversationButton - Button to start a new conversation
 *
 * Features:
 * - Prominent styling
 * - Disabled state
 * - Clear icon and label
 */
export function NewConversationButton({ onClick, disabled = false }: NewConversationButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="w-full"
      size="lg"
      aria-label="Start new conversation"
    >
      <Plus className="mr-2 h-5 w-5" />
      New Conversation
    </Button>
  );
}

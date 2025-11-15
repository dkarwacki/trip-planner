import React from "react";
import { MessageCircle, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaChip } from "../personas/PersonaChip";
import type { ConversationSummary } from "../types";

/**
 * Simple relative time formatter
 */
function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

interface ConversationListItemProps {
  conversation: ConversationSummary;
  isActive?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onOpenMap?: () => void;
}

/**
 * ConversationListItem - Individual conversation in the library
 *
 * Features:
 * - Title with inline edit option (future)
 * - Persona badges (icons only)
 * - Message count badge
 * - Relative timestamp
 * - Trip indicator if linked
 * - Active state highlighting
 * - Delete button
 */
export function ConversationListItem({
  conversation,
  isActive = false,
  onSelect,
  onDelete,
  onOpenMap,
}: ConversationListItemProps) {
  const relativeTime = getRelativeTime(conversation.updatedAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group w-full rounded-lg border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer ${
        isActive
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      }`}
    >
      {/* Header: Title and actions */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="flex-1 font-medium leading-tight line-clamp-2">{conversation.title}</h3>

        <div className="flex gap-1">
          {conversation.tripId && onOpenMap && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMap();
              }}
              aria-label="Open trip map"
            >
              <ExternalLink size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete conversation"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {/* Message count */}
        <div className="flex items-center gap-1">
          <MessageCircle size={12} />
          <span>{conversation.messageCount}</span>
        </div>

        {/* Timestamp */}
        <span>•</span>
        <span>{relativeTime}</span>

        {/* Trip indicator */}
        {conversation.tripId && (
          <>
            <span>•</span>
            <span className="text-primary">Trip created</span>
          </>
        )}
      </div>

      {/* Personas */}
      {conversation.personas && conversation.personas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {conversation.personas.slice(0, 3).map((persona) => (
            <PersonaChip
              key={persona}
              persona={persona}
              isSelected={false}
              onToggle={() => {}}
              showLabel={false}
              size="sm"
            />
          ))}
          {conversation.personas.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{conversation.personas.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

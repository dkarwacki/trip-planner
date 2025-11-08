import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, MessageSquare, MapPin, Trash2, ChevronRight } from "lucide-react";
import type { SavedConversation, ConversationId, SavedTrip } from "@/domain/plan/models";
import { PERSONA_METADATA } from "@/domain/plan/models";
import { getTripsForConversation, deleteTripFromHistory } from "@/lib/common/storage";

interface ConversationHistoryPanelProps {
  conversations: SavedConversation[];
  onContinueConversation: (conversationId: ConversationId) => void;
  onDeleteConversation: (conversationId: ConversationId) => void;
  onOpenTrip: (tripId: string) => void;
}

export default function ConversationHistoryPanel({
  conversations,
  onContinueConversation,
  onDeleteConversation,
  onOpenTrip,
}: ConversationHistoryPanelProps) {
  const [expandedConversation, setExpandedConversation] = useState<ConversationId | null>(null);
  const isEmpty = conversations.length === 0;

  const toggleExpanded = (conversationId: ConversationId) => {
    setExpandedConversation((prev) => (prev === conversationId ? null : conversationId));
  };

  const handleDeleteConversation = (conversationId: ConversationId) => {
    if (confirm("Delete this conversation? Associated trips will remain in history.")) {
      onDeleteConversation(conversationId);
      if (expandedConversation === conversationId) {
        setExpandedConversation(null);
      }
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="h-full w-full flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="border-b flex-shrink-0 px-4 py-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Conversation History
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 min-h-0 p-4">
        {isEmpty ? (
          <div className="text-center text-gray-500 py-8">
            <History className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium">No saved conversations yet</p>
            <p className="text-xs mt-1">Your conversations will be saved automatically</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const trips = getTripsForConversation(conversation.id);
              const isExpanded = expandedConversation === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className="p-3 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h4 className="text-sm font-medium text-gray-900 mb-1 break-words" style={{ overflowWrap: "anywhere" }}>
                        {conversation.title}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {conversation.personas.slice(0, 2).map((persona) => {
                          const metadata = PERSONA_METADATA[persona];
                          return metadata ? (
                            <Badge key={persona} variant="secondary" className="text-xs">
                              {metadata.label}
                            </Badge>
                          ) : null;
                        })}
                        {conversation.personas.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{conversation.personas.length - 2}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 flex-shrink-0" />
                          {conversation.messageCount} {conversation.messageCount === 1 ? "message" : "messages"}
                        </span>
                        <span>{formatTimestamp(conversation.lastUpdated)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteConversation(conversation.id)}
                      className="h-8 w-8 p-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onContinueConversation(conversation.id)}
                      className="w-full"
                    >
                      Continue Chat
                    </Button>

                    {trips.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleExpanded(conversation.id)}
                        className="w-full gap-1.5"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {trips.length} {trips.length === 1 ? "Trip" : "Trips"}
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </Button>
                    )}
                  </div>

                  {isExpanded && trips.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1.5">
                      {trips.map((trip: SavedTrip) => (
                        <div key={trip.id} className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOpenTrip(trip.id)}
                            className="flex-1 justify-start text-xs h-8"
                          >
                            <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">{trip.title}</span>
                            <span className="ml-auto text-muted-foreground">({trip.placeCount})</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Delete this trip?")) {
                                deleteTripFromHistory(trip.id);
                                // Force re-render by toggling expansion
                                setExpandedConversation(null);
                                setTimeout(() => setExpandedConversation(conversation.id), 0);
                              }
                            }}
                            className="h-8 w-8 p-0"
                            title="Delete trip"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}

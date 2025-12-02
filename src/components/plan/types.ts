import type { PersonaType } from "@/domain/plan/models/Persona";
import type { ChatMessage, PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";
import type { TripId } from "@/domain/plan/models/TripHistory";
import type { PlacePhoto } from "@/domain/common/models";
import type { AuthUser } from "@/components/auth/stores/types";

// UI State types

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface ItineraryPlace {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photos?: PlacePhoto[];
}

export interface ConversationSummary {
  id: ConversationId;
  title: string;
  personas: PersonaType[];
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  tripId?: TripId;
  isActive?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}

export interface ItineraryState {
  places: ItineraryPlace[];
  isDirty: boolean;
}

export interface PersonaState {
  selected: PersonaType[];
  isDirty: boolean;
}

export interface ConversationState {
  id?: ConversationId;
  title: string;
  tripId?: TripId;
  isDirty: boolean;
  saveStatus: SaveStatus;
}

// Component Props

export interface LayoutProps {
  conversationId?: string | null;
  user?: AuthUser;
}

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onAddPlace: (place: PlaceSuggestion) => void;
  selectedPersonas: PersonaType[];
  onPersonaChange?: (personas: PersonaType[]) => void;
  error?: string;
  onRetry?: () => void;
  addedPlaceIds?: Set<string>;
}

export interface PersonaSelectorProps {
  selected: PersonaType[];
  onChange: (personas: PersonaType[]) => void;
  isLoading?: boolean;
  isMobile?: boolean;
  readOnly?: boolean;
  showOnlySelected?: boolean;
}

export interface ItineraryPanelProps {
  places: ItineraryPlace[];
  onReorder: (places: ItineraryPlace[]) => void;
  onRemove: (placeId: string) => void;
  onExportToMap: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
}

export interface ConversationLibraryProps {
  conversations: ConversationSummary[];
  activeConversationId?: ConversationId;
  onSelect: (conversationId: ConversationId) => void;
  onDelete: (conversationId: ConversationId) => void;
  onNewConversation: () => void;
  onOpenMap?: (conversationId: ConversationId) => void;
  isLoading?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
}

export type MobileTab = "chat" | "plan" | "sessions";

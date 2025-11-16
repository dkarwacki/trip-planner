/**
 * Shared type definitions for map-v2 components
 */

// View mode for discovery results display
export type ViewMode = "cards" | "grid" | "list";

// Desktop sidebar modes
export type DesktopMode = "discover" | "plan" | "ai";

// Mobile bottom navigation tabs
export type MobileTab = "map" | "plan" | "discover";

// Auto-save status
export type SaveStatus = "idle" | "saving" | "saved" | "error";

// Priority level for AI suggestions
export type PriorityLevel = "must-see" | "highly-recommended" | "hidden-gem";

// Filter state for discovery results
export interface FilterState {
  category: "all" | "attractions" | "restaurants";
  minScore: 7 | 8 | 9;
  showHighQualityOnly: boolean;
}

// AI conversation message
export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: AISuggestion[];
}

// AI suggestion card
export interface AISuggestion {
  id: string;
  placeId: string | null; // Null for general tips
  placeName: string | null; // Null for general tips
  priority: PriorityLevel;
  reasoning: string;
  score: number | null; // Null for general tips
  category: string;
  photoUrl?: string;
  type: "add_attraction" | "add_restaurant" | "general_tip";
  attractionData?: any; // Full attraction data from API for adding to plan
}

// Component props interfaces
export interface PlaceCardProps {
  place: any; // Will be typed with domain Place type
  viewMode: ViewMode;
  isAdded: boolean;
  onAddClick: (placeId: string) => void;
  onCardClick: (placeId: string) => void;
}

export interface HubCardProps {
  place: any; // Will be typed with domain Place type
  order: number;
  isExpanded: boolean;
  onToggleExpand: (placeId: string) => void;
  onDiscoverMore: (placeId: string) => void;
}

export interface SuggestionCardProps {
  suggestion: AISuggestion;
  isAdded: boolean;
  isAdding?: boolean;
  onAddClick: (placeId: string) => void;
}

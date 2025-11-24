import { useMapStore } from "../../stores/mapStore";
import { useAIChat } from "../../hooks/useAIChat";
import type { PlannedPlaceViewModel } from "@/lib/map-v2/types";

export function useMobileAIChat(selectedPlace: PlannedPlaceViewModel | null | undefined) {
  const conversation = useMapStore((state) => state.conversation);
  const context = useMapStore((state) => state.context);
  const setAIContext = useMapStore((state) => state.setAIContext);
  const isLoadingAI = useMapStore((state) => state.isLoading);

  const { sendMessage, isLoading, addSuggestionToPlan, addingPlaceIds, addedPlaceIds } = useAIChat();

  const hasMessages = conversation.length > 0;
  const suggestedPrompts =
    selectedPlace && !hasMessages
      ? ["Must-see highlights", "Best local restaurants", "Hidden gems nearby", "Family-friendly activities"]
      : [];

  const handleOpenAIChat = () => {
    if (selectedPlace && context !== selectedPlace.id) {
      setAIContext(selectedPlace.id);
    }
    // Modal open state is managed by the modal component itself
  };

  const handleCloseAIChat = () => {
    // Modal close state is managed by the modal component itself
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedPlace) {
      console.warn("No place selected");
      return;
    }
    await sendMessage(message);
  };

  const handleAddSuggestion = (placeId: string) => {
    addSuggestionToPlan(placeId);
  };

  return {
    conversation,
    isLoading,
    isLoadingAI,
    suggestedPrompts,
    addedPlaceIds,
    addingPlaceIds,
    handleOpenAIChat,
    handleCloseAIChat,
    handleSendMessage,
    handleAddSuggestion,
  };
}

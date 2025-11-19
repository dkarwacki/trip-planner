import { useMapStore } from "../../stores/mapStore";
import { useAIChat } from "../../hooks/useAIChat";
import type { Place } from "@/domain/common/models";

export function useMobileAIChat(selectedPlace: Place | null | undefined) {
  const conversation = useMapStore((state) => state.conversation);
  const context = useMapStore((state) => state.context);
  const aiChatModalOpen = useMapStore((state) => state.aiChatModalOpen);
  const setAIContext = useMapStore((state) => state.setAIContext);
  const setAIChatModalOpen = useMapStore((state) => state.setAIChatModalOpen);
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
    setAIChatModalOpen(true);
  };

  const handleCloseAIChat = () => {
    setAIChatModalOpen(false);
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
    aiChatModalOpen,
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

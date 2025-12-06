/**
 * AI mode component
 * Shows AI assistant chat interface
 */

import React, { useEffect } from "react";
import { AIChatPanel } from "../sidebar/ai";
import { useMapStore } from "../stores/mapStore";

export function AIMode() {
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const context = useMapStore((state) => state.context);
  const setAIContext = useMapStore((state) => state.setAIContext);
  const clearConversation = useMapStore((state) => state.clearAIConversation);

  // Set AI context when entering AI mode
  useEffect(() => {
    if (selectedPlaceId && context !== selectedPlaceId) {
      setAIContext(selectedPlaceId);
    }
  }, [selectedPlaceId, context, setAIContext]);

  // Clear conversation when switching places
  useEffect(() => {
    if (context && context !== selectedPlaceId) {
      clearConversation();
      setAIContext(selectedPlaceId);
    }
  }, [selectedPlaceId, context, clearConversation, setAIContext]);

  return (
    <div data-testid="ai-mode">
      <AIChatPanel />
    </div>
  );
}

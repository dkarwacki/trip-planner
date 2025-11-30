import type { StateCreator } from "zustand";
import type { MapStore, AIState, AIActions } from "../types";

export const createAISlice: StateCreator<
  MapStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  AIState & AIActions
> = (set) => ({
  // State
  conversation: [],
  context: null,
  isLoading: false,
  modalOpen: false,

  // Actions
  addAIMessage: (message) =>
    set((state) => ({
      conversation: [...state.conversation, message],
    })),

  clearAIConversation: () => set({ conversation: [] }),

  setAIContext: (placeId) => set({ context: placeId }),

  setAIChatModalOpen: (open) => set({ modalOpen: open }),
});

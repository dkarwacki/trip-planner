/**
 * AI mode component
 * Shows AI assistant chat interface
 */

import React, { useEffect } from 'react';
import { AIChatPanel } from '../sidebar/ai';
import { useMapState } from '../context';

export function AIMode() {
  const { state, dispatch } = useMapState();

  // Set AI context when entering AI mode
  useEffect(() => {
    if (state.selectedPlaceId && state.aiContext !== state.selectedPlaceId) {
      dispatch({ type: 'SET_AI_CONTEXT', payload: state.selectedPlaceId });
    }
  }, [state.selectedPlaceId, state.aiContext, dispatch]);

  // Clear conversation when switching places
  useEffect(() => {
    if (state.aiContext && state.aiContext !== state.selectedPlaceId) {
      dispatch({ type: 'CLEAR_AI_CONVERSATION' });
      dispatch({ type: 'SET_AI_CONTEXT', payload: state.selectedPlaceId });
    }
  }, [state.selectedPlaceId, state.aiContext, dispatch]);

  return <AIChatPanel />;
}


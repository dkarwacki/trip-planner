/**
 * Individual hub card with banner, stats, collapsible sections
 * Shows attractions and restaurants grouped for a hub location
 */

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMapState } from '../context/MapStateContext';
import { GripVertical, ChevronRight, ChevronDown, Search } from 'lucide-react';
import PlannedItemList from './PlannedItemList';

interface HubCardProps {
  place: any; // Will be typed with domain types
  order: number;
  isExpanded: boolean;
  onToggleExpand: (placeId: string) => void;
}

export default function HubCard({ place, order, isExpanded, onToggleExpand }: HubCardProps) {
  const { dispatch } = useMapState();
  
  // Setup sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id || place });
  
  // Track which category sections are expanded (attractions, restaurants)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    attractions: isExpanded,
    restaurants: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // TODO: Get actual attractions and restaurants from data structure
  const attractions: any[] = [];
  const restaurants: any[] = [];

  const placeName = place.name || place.displayName || 'Unknown Place';
  const placeLocation = place.location || place.vicinity || '';

  const handleDiscoverMore = () => {
    dispatch({ type: 'SELECT_PLACE', payload: place.id });
    dispatch({ type: 'SET_ACTIVE_MODE', payload: 'discover' });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-border bg-card shadow-sm overflow-hidden ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      }`}
    >
      {/* Banner with drag handle and photo */}
      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/5">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 flex w-11 items-center justify-center cursor-grab hover:bg-black/5 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Number badge */}
        <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow">
          {order}
        </div>

        {/* TODO: Add banner photo when available */}
      </div>

      {/* Card content */}
      <div className="p-4">
        {/* Hub name and location */}
        <button
          onClick={() => onToggleExpand(place.id)}
          className="w-full text-left"
        >
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {placeName}
          </h3>
          {placeLocation && (
            <p className="text-sm text-muted-foreground">
              {placeLocation}
            </p>
          )}
        </button>

        {/* Stats */}
        <div className="mt-2 text-sm text-muted-foreground">
          {attractions.length} {attractions.length === 1 ? 'attraction' : 'attractions'} • {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
        </div>

        {/* Collapsible sections */}
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {/* Attractions section */}
            <div>
              <button
                onClick={() => toggleSection('attractions')}
                className="flex w-full items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
              >
                {expandedSections.attractions ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Attractions ({attractions.length})</span>
              </button>

              {expandedSections.attractions && (
                <div className="mt-2">
                  {attractions.length > 0 ? (
                    <PlannedItemList items={attractions} category="attractions" />
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2 px-4">
                      No attractions added yet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Restaurants section */}
            <div>
              <button
                onClick={() => toggleSection('restaurants')}
                className="flex w-full items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
              >
                {expandedSections.restaurants ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Restaurants ({restaurants.length})</span>
              </button>

              {expandedSections.restaurants && (
                <div className="mt-2">
                  {restaurants.length > 0 ? (
                    <PlannedItemList items={restaurants} category="restaurants" />
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2 px-4">
                      No restaurants added yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discover more button */}
        {isExpanded && (
          <button
            onClick={handleDiscoverMore}
            className="mt-4 w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            Discover more
          </button>
        )}
      </div>
    </div>
  );
}


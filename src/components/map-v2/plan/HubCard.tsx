/**
 * Individual hub card with banner, stats, collapsible sections
 * Shows attractions and restaurants grouped for a hub location
 */

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMapState } from '../context/MapStateContext';
import { GripVertical, ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import PlannedItemList from './PlannedItemList';
import PhotoImage from '@/components/common/PhotoImage';

interface HubCardProps {
  place: any; // Will be typed with domain types
  order: number;
  isExpanded: boolean;
  onToggleExpand: (placeId: string) => void;
}

export default function HubCard({ place, order, isExpanded, onToggleExpand }: HubCardProps) {
  const { dispatch, setSelectedPlace, removeFromPlanning } = useMapState();
  
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

  // Get actual attractions and restaurants from place data
  const attractions: any[] = place.plannedAttractions || [];
  const restaurants: any[] = place.plannedRestaurants || [];

  // Get first attraction's photo for banner
  const bannerPhoto = attractions[0]?.photos?.[0];

  const placeName = place.name || place.displayName || 'Unknown Place';
  const placeLocation = place.location || place.vicinity || '';

  const handleDiscoverMore = () => {
    dispatch({ type: 'SELECT_PLACE', payload: place.id });
    dispatch({ type: 'SET_ACTIVE_MODE', payload: 'discover' });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromPlanning(place.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[data-sortable-handle]');

    // Don't trigger if clicking on the drag handle area
    if (target.closest('[class*="cursor-grab"]') || target.closest('[class*="cursor-grabbing"]')) {
      return;
    }

    if (!isInteractiveElement) {
      onToggleExpand(place.id);
      setSelectedPlace(place.id);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`rounded-lg border border-border bg-card shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      }`}
    >
      {/* Banner with drag handle and photo */}
      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {/* Background photo if available */}
        {bannerPhoto && (
          <div className="absolute inset-0">
            <PhotoImage
              photoReference={bannerPhoto.photoReference}
              alt={attractions[0]?.name || 'Place photo'}
              maxWidth={400}
              className="w-full h-full object-cover opacity-70"
            />
            {/* Overlay gradient for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
          </div>
        )}

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          data-sortable-handle
          className="absolute left-0 top-0 bottom-0 flex w-11 items-center justify-center cursor-grab hover:bg-black/5 active:cursor-grabbing z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Number badge */}
        <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow z-10">
          {order}
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 group">
        {/* Hub name and location */}
        <div className="w-full text-left relative">
          <h3 className="text-lg font-semibold text-foreground mb-1 pr-8">
            {placeName}
          </h3>
          {placeLocation && (
            <p className="text-sm text-muted-foreground">
              {placeLocation}
            </p>
          )}
          {/* Remove button */}
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove hub from itinerary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

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
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('attractions');
                }}
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
                    <PlannedItemList items={attractions} category="attractions" placeId={place.id} />
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
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('restaurants');
                }}
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
                    <PlannedItemList items={restaurants} category="restaurants" placeId={place.id} />
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
            onClick={(e) => {
              e.stopPropagation();
              handleDiscoverMore();
            }}
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


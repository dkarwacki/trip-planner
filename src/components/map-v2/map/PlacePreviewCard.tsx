import React from "react";
import { MapPin, Plus, X, Move } from "lucide-react";
import type { Place } from "@/domain/common/models";

interface PlacePreviewCardProps {
  place: Place;
  country?: string;
  onConfirm: () => void;
  onAdjust: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export function PlacePreviewCard({
  place,
  country,
  onConfirm,
  onAdjust,
  onCancel,
  isConfirming = false,
}: PlacePreviewCardProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">{place.name || "New Location"}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {country || `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onAdjust}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl py-2.5 font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Move className="w-4 h-4" />
            Adjust Position
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="flex-1 bg-black hover:bg-gray-800 text-white rounded-xl py-2.5 font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            {isConfirming ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add to Trip
          </button>
        </div>
      </div>
    </div>
  );
}

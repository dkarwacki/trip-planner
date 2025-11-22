import React from "react";
import { MapPin } from "lucide-react";

interface AdjustLocationCardProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdjustLocationCard({ onConfirm, onCancel }: AdjustLocationCardProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" />
          <p className="text-sm font-medium text-gray-700">Drag map to adjust location</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl py-2.5 font-medium text-sm transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-black hover:bg-gray-800 text-white rounded-xl py-2.5 font-medium text-sm transition-colors shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

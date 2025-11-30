import React from "react";

interface PinModeUIProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function PinModeUI({ onCancel, onConfirm }: PinModeUIProps) {
  return (
    <>
      {/* Fixed Center Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
        <div className="relative -mt-7">
          <div className="drop-shadow-md animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="white"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" fill="#3B82F6" />
            </svg>
          </div>
          <div className="w-1.5 h-1.5 bg-black/20 rounded-full absolute left-1/2 -translate-x-1/2 top-full blur-sm" />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-3 pointer-events-auto">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-50 transition-colors font-medium border border-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Confirm Location
        </button>
      </div>
    </>
  );
}

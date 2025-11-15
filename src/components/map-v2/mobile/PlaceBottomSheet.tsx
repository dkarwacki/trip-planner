/**
 * Place Bottom Sheet
 * Two-stage bottom sheet using vaul: 30% quick preview, 85% full details
 */

import React from 'react';
import { Drawer } from 'vaul';
import { useMapState } from '../context';
import { PlaceQuickView } from './PlaceQuickView';
import { PlaceFullView } from './PlaceFullView';

export function PlaceBottomSheet() {
  const { getSelectedPlace, setSelectedPlace } = useMapState();
  const [snapPoint, setSnapPoint] = React.useState<number | string | null>(0.3);

  const selectedPlace = getSelectedPlace();
  const isOpen = selectedPlace !== null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedPlace(null);
      setSnapPoint(0.3);
    }
  };

  const handleExpandToFull = () => {
    setSnapPoint(0.85);
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      snapPoints={[0.3, 0.85]}
      activeSnapPoint={snapPoint}
      setActiveSnapPoint={setSnapPoint}
      dismissible={true}
      modal={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/20" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[24px] bg-white"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Drag Handle */}
          <div className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />

          {/* Content Container */}
          <div className="flex-1 overflow-y-auto">
            {selectedPlace && (
              <>
                {snapPoint === 0.3 ? (
                  <PlaceQuickView
                    place={selectedPlace}
                    onExpandClick={handleExpandToFull}
                  />
                ) : (
                  <PlaceFullView place={selectedPlace} />
                )}
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}


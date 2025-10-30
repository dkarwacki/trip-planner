import { Map, List, Compass, CheckSquare } from "lucide-react";

export type MobileTab = "places" | "map" | "explore" | "plan";

interface MobileNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  placesCount?: number;
  plannedItemsCount?: number;
  hasSelectedPlace?: boolean;
}

export function MobileNavigation({
  activeTab,
  onTabChange,
  placesCount = 0,
  plannedItemsCount = 0,
  hasSelectedPlace = false,
}: MobileNavigationProps) {
  const tabs = [
    {
      id: "places" as MobileTab,
      label: "Places",
      icon: List,
      badge: placesCount > 0 ? placesCount : undefined,
      disabled: false,
    },
    {
      id: "map" as MobileTab,
      label: "Map",
      icon: Map,
      disabled: false,
    },
    {
      id: "explore" as MobileTab,
      label: "Explore",
      icon: Compass,
      disabled: !hasSelectedPlace,
    },
    {
      id: "plan" as MobileTab,
      label: "Plan",
      icon: CheckSquare,
      badge: plannedItemsCount > 0 ? plannedItemsCount : undefined,
      disabled: plannedItemsCount === 0,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 ${
                isDisabled
                  ? "text-gray-300 cursor-not-allowed"
                  : isActive
                    ? "text-blue-600 active:scale-95"
                    : "text-gray-500 hover:text-gray-700 active:text-gray-900 active:scale-95"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={isDisabled}
            >
              {/* Active indicator */}
              {isActive && !isDisabled && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full" />
              )}
              
              <div className="relative mt-1">
                <Icon 
                  className="h-7 w-7" 
                  strokeWidth={isActive && !isDisabled ? 2.5 : 2} 
                />
                {tab.badge !== undefined && !isDisabled && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 shadow-sm">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 leading-tight ${
                  isDisabled ? "font-medium" : isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

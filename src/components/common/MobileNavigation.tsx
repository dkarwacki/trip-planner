import type { LucideIcon } from "lucide-react";

export type MapTab = "places" | "map" | "explore" | "plan";
export type PlanTab = "assistant" | "itinerary" | "history";
export type MobileTab = MapTab | PlanTab;

interface TabConfig {
  id: MobileTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
  disabled?: boolean;
}

interface MobileNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  tabs: TabConfig[];
}

export function MobileNavigation({ activeTab, onTabChange, tabs }: MobileNavigationProps) {
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
                    ? "text-gray-700 active:scale-95"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 active:text-gray-900 active:scale-95"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={isDisabled}
            >
              {/* Active indicator */}
              {isActive && !isDisabled && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-b-full" />
              )}

              <div className="relative mt-0.5">
                <Icon className="h-6 w-6" strokeWidth={isActive && !isDisabled ? 2.5 : 2} />
                {tab.badge !== undefined && !isDisabled && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gray-700 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 shadow-sm">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-0 leading-tight ${
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

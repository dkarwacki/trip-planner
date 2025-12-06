/**
 * Mobile Bottom Navigation
 * Three-tab navigation: Map | Discover | Plan
 * Includes safe-area handling for iOS notch devices
 */

import React from "react";
import { Map, Compass, ListTodo } from "lucide-react";
import { cn } from "@/lib/common/utils";

export type MobileTab = "map" | "discover" | "plan";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  planItemCount?: number;
}

export function MobileBottomNav({ activeTab, onTabChange, planItemCount = 0 }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-200 bg-white pt-2"
      style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
      data-testid="mobile-bottom-nav"
    >
      <div className="flex h-[55px] items-center justify-around">
        {/* Map Tab */}
        <TabButton
          active={activeTab === "map"}
          icon={<Map className="h-6 w-6" />}
          label="Map"
          onClick={() => onTabChange("map")}
          dataTestId="mobile-tab-map"
        />

        {/* Discover Tab */}
        <TabButton
          active={activeTab === "discover"}
          icon={<Compass className="h-6 w-6" />}
          label="Discover"
          onClick={() => onTabChange("discover")}
          dataTestId="mobile-tab-discover"
        />

        {/* Plan Tab */}
        <TabButton
          active={activeTab === "plan"}
          icon={<ListTodo className="h-6 w-6" />}
          label="Plan"
          badge={planItemCount > 0 ? planItemCount : undefined}
          onClick={() => onTabChange("plan")}
          dataTestId="mobile-tab-plan"
        />
      </div>
    </nav>
  );
}

interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
  dataTestId?: string;
}

function TabButton({ active, icon, label, badge, onClick, dataTestId }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex min-w-[50px] flex-1 flex-col items-center gap-1 transition-colors justify-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        active ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
      )}
      aria-current={active ? "page" : undefined}
      data-testid={dataTestId}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className={cn("text-xs", active ? "font-semibold" : "font-medium")}>{label}</span>
    </button>
  );
}

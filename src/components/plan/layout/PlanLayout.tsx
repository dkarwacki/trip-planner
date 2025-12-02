import React from "react";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import type { LayoutProps } from "../types";
import { useResponsive } from "@/components/map/hooks/useResponsive";

/**
 * PlanLayout - Main layout orchestrator
 *
 * Responsibilities:
 * - Detects viewport size and renders appropriate layout
 * - Manages global state for the plan view
 * - Handles conversation loading from URL params
 */
export function PlanLayout({ conversationId, user }: LayoutProps) {
  const { isMobile } = useResponsive();

  // Render appropriate layout based on viewport
  if (isMobile) {
    return <MobileLayout conversationId={conversationId} user={user} />;
  }

  return <DesktopLayout conversationId={conversationId} user={user} />;
}

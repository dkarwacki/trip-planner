import React, { useState, useEffect } from "react";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import type { LayoutProps } from "../types";

/**
 * PlanLayout - Main layout orchestrator
 *
 * Responsibilities:
 * - Detects viewport size and renders appropriate layout
 * - Manages global state for the plan view
 * - Handles conversation loading from URL params
 */
export function PlanLayout({ conversationId }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Render appropriate layout based on viewport
  if (isMobile) {
    return <MobileLayout conversationId={conversationId} />;
  }

  return <DesktopLayout conversationId={conversationId} />;
}

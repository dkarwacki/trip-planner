/**
 * Plan mode component
 * Shows itinerary builder with places and attractions
 */

import React from "react";
import { PlanPanel } from "../plan";

export function PlanMode() {
  return (
    <div data-testid="plan-mode">
      <PlanPanel />
    </div>
  );
}

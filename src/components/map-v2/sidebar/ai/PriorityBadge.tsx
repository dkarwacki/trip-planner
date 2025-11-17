/**
 * Priority badge for AI suggestions
 * Three types: Must-See, Highly Recommended, Hidden Gem
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { PriorityLevel } from "../../types";

interface PriorityBadgeProps {
  priority: PriorityLevel;
}

const priorityConfig: Record<
  PriorityLevel,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  "must-see": {
    label: "Must-See",
    variant: "destructive",
  },
  "highly-recommended": {
    label: "Recommended",
    variant: "default",
  },
  "hidden-gem": {
    label: "Hidden Gem",
    variant: "secondary",
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

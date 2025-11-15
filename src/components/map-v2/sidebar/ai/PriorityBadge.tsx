/**
 * Priority badge for AI suggestions
 * Three types: Must-See, Highly Recommended, Hidden Gem
 */

import React from 'react';
import type { PriorityLevel } from '../../types';

interface PriorityBadgeProps {
  priority: PriorityLevel;
}

const priorityConfig: Record<PriorityLevel, { label: string; className: string }> = {
  'must-see': {
    label: 'Must-See',
    className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
  },
  'highly-recommended': {
    label: 'Recommended',
    className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  },
  'hidden-gem': {
    label: 'Hidden Gem',
    className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}


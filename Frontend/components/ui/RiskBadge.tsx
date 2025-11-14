'use client';

import { RiskLevel } from '@/lib/types';
import { getRiskColor, getRiskEmoji } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  pulse?: boolean;
  className?: string;
}

export function RiskBadge({ level, showIcon = true, pulse = false, className = '' }: RiskBadgeProps) {
  const baseClasses = `inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-caption font-medium border ${getRiskColor(level)} ${className}`;

  const badge = (
    <span className={baseClasses}>
      {showIcon && <span>{getRiskEmoji(level)}</span>}
      <span className="capitalize">{level} risk</span>
    </span>
  );

  if (pulse) {
    return (
      <motion.div
        animate={{
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}

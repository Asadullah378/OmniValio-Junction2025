'use client';

import { DashboardStats } from '@/lib/types';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Bell, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface HeroSummaryProps {
  stats: DashboardStats;
}

export function HeroSummary({ stats }: HeroSummaryProps) {
  const statItems = [
    {
      label: 'Deliveries Today',
      value: stats.deliveriesToday,
      icon: Package,
      color: 'text-valio-600',
      bgColor: 'bg-valio-50',
    },
    {
      label: 'At-Risk Items',
      value: stats.atRiskItems,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Unresolved Alerts',
      value: stats.unresolvedAlerts,
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'AI Actions Taken',
      value: stats.aiActionsCount,
      icon: Sparkles,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: 'automated substitutions',
    },
  ];

  return (
    <Card className="!p-8 bg-gradient-to-br from-white to-glacier-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex items-start gap-4"
          >
            <div className={`p-3 rounded-soft-lg ${item.bgColor}`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="flex-1">
              <motion.div
                className="text-display-xl font-bold text-glacier-900 mb-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1 + 0.2,
                  duration: 0.6,
                  type: 'spring',
                  stiffness: 100,
                }}
              >
                {item.value}
              </motion.div>
              <div className="text-body-sm text-glacier-600">
                {item.label}
              </div>
              {item.subtitle && (
                <div className="text-caption text-glacier-500 mt-0.5">
                  {item.subtitle}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

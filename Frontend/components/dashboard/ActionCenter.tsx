'use client';

import { Alert } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Info, CreditCard, ArrowRight } from 'lucide-react';
import { getRelativeTime } from '@/lib/utils';

interface ActionCenterProps {
  alerts: Alert[];
}

export function ActionCenter({ alerts }: ActionCenterProps) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'shortage':
        return AlertTriangle;
      case 'substitution':
        return Check;
      case 'credit':
        return CreditCard;
      default:
        return Info;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-glacier-50 border-glacier-200 text-glacier-700';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-heading text-glacier-900 mb-4">Action Center</h2>

      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const Icon = getAlertIcon(alert.type);

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`!p-4 border-2 ${getSeverityColor(alert.severity)}`}>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-glacier-900 mb-1">
                      {alert.title}
                    </h3>
                    <p className="text-body-sm text-glacier-700 mb-3">
                      {alert.message}
                    </p>

                    <div className="text-caption text-glacier-500 mb-3">
                      {getRelativeTime(alert.timestamp)}
                    </div>

                    {alert.actionRequired && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button size="sm" className="flex-1 justify-center">
                          {alert.type === 'shortage' ? 'Accept Substitution' :
                           alert.type === 'substitution' ? 'Review Alternatives' :
                           'View Details'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 justify-center">
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {/* Empty state */}
        {alerts.length === 0 && (
          <Card className="!p-8 text-center">
            <div className="text-4xl mb-3">🟢</div>
            <p className="text-body text-glacier-600">
              All clear! No pending actions.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

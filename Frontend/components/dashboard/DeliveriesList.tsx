'use client';

import { useState } from 'react';
import { Delivery } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { ChevronDown, ChevronUp, Clock, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTemperatureZoneEmoji } from '@/lib/utils';

interface DeliveriesListProps {
  deliveries: Delivery[];
}

export function DeliveriesList({ deliveries }: DeliveriesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(deliveries[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-heading text-glacier-900 mb-4">Today's Deliveries</h2>

      {deliveries.map((delivery, index) => (
        <motion.div
          key={delivery.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="!p-0 overflow-hidden">
            {/* Delivery Header */}
            <button
              onClick={() => toggleExpand(delivery.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-glacier-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-valio-50 rounded-soft">
                  <Truck className="w-5 h-5 text-valio-600" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-glacier-900">
                      Route {delivery.routeNumber}
                    </span>
                    <StatusChip status={delivery.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-body-sm text-glacier-600">
                    <Clock className="w-4 h-4" />
                    <span>{delivery.timeWindow}</span>
                    {delivery.estimatedArrival && (
                      <span className="text-valio-600 font-medium">
                        • ETA: {delivery.estimatedArrival}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {delivery.atRiskItemsCount > 0 && (
                  <span className="text-body-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                    {delivery.atRiskItemsCount} at risk
                  </span>
                )}
                {expandedId === delivery.id ? (
                  <ChevronUp className="w-5 h-5 text-glacier-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-glacier-400" />
                )}
              </div>
            </button>

            {/* Expanded Items List */}
            <AnimatePresence>
              {expandedId === delivery.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-glacier-200"
                >
                  <div className="px-6 py-4 bg-glacier-50/50">
                    <div className="space-y-3">
                      {delivery.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-white rounded-soft border border-glacier-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-glacier-100 rounded flex items-center justify-center overflow-hidden">
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-glacier-900">
                                  {item.product.name}
                                </span>
                                <span className="text-caption text-glacier-500">
                                  {getTemperatureZoneEmoji(item.product.temperatureZone)}
                                </span>
                              </div>
                              <div className="text-body-sm text-glacier-600">
                                Qty: {item.quantity} • Priority: {' '}
                                <span className={`font-medium ${
                                  item.priority === 'critical' ? 'text-red-700' :
                                  item.priority === 'important' ? 'text-amber-700' :
                                  'text-green-700'
                                }`}>
                                  {item.priority}
                                </span>
                              </div>
                              {/* Risk meter */}
                              <div className="mt-1 w-32 h-1.5 bg-glacier-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    item.riskLevel === 'high' ? 'bg-red-500' :
                                    item.riskLevel === 'medium' ? 'bg-amber-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{
                                    width: `${
                                      item.riskLevel === 'high' ? 90 :
                                      item.riskLevel === 'medium' ? 60 : 20
                                    }%`
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <RiskBadge level={item.riskLevel} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

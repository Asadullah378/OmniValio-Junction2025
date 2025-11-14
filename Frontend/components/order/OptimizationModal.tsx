'use client';

import { OrderItem } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertTriangle, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { formatCurrency, getSimilarityColor } from '@/lib/utils';
import { generateSubstitutions, mockProducts } from '@/lib/mockData';
import { useState } from 'react';

interface OptimizationModalProps {
  isOpen: boolean;
  items: OrderItem[];
  onClose: () => void;
  onAcceptAll: () => void;
}

export function OptimizationModal({ isOpen, items, onClose, onAcceptAll }: OptimizationModalProps) {
  const [selectedActions, setSelectedActions] = useState<Record<string, 'replace' | 'keep' | 'remove'>>({});

  const highRiskFlexibleItems = items.filter(
    item => item.riskLevel === 'high' && item.priority === 'flexible'
  );

  const criticalRiskItems = items.filter(
    item => item.riskLevel === 'high' && item.priority === 'critical'
  );

  const handleAction = (itemId: string, action: 'replace' | 'keep' | 'remove') => {
    setSelectedActions({ ...selectedActions, [itemId]: action });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-glacier-900/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-white rounded-soft-xl shadow-soft-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-glacier-200 bg-gradient-to-r from-valio-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-valio-600 rounded-soft">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-display-lg text-glacier-900">
                    Omni-Valio Smart Recommendations
                  </h2>
                </div>
                <p className="text-body text-glacier-600">
                  AI-powered suggestions to optimize your order and reduce risks
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-glacier-100 rounded-soft transition-colors"
              >
                <X className="w-6 h-6 text-glacier-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
            {/* Section 1: Recommended Changes for Flexible Items */}
            {highRiskFlexibleItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-valio-600" />
                  <h3 className="text-heading text-glacier-900">
                    Recommended Changes
                  </h3>
                  <span className="px-2 py-0.5 bg-valio-50 text-valio-700 text-caption rounded-full">
                    {highRiskFlexibleItems.length} suggestions
                  </span>
                </div>

                <div className="space-y-6">
                  {highRiskFlexibleItems.map((item) => {
                    const substitutions = generateSubstitutions(item.product, mockProducts);

                    return (
                      <Card key={item.id} className="!p-6 bg-gradient-to-br from-white to-glacier-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left: Original Item */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-caption text-glacier-600 font-semibold uppercase">
                                Current Selection
                              </span>
                              <RiskBadge level={item.riskLevel} pulse />
                            </div>

                            <div className="bg-white border-2 border-amber-200 rounded-soft-lg p-4">
                              <div className="flex gap-3 mb-3">
                                <div className="w-20 h-20 bg-glacier-100 rounded overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-glacier-900 mb-1">
                                    {item.product.name}
                                  </h4>
                                  <p className="text-body-sm text-glacier-600 mb-2">
                                    {formatCurrency(item.product.price)} × {item.quantity}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span className="text-caption text-amber-700">
                                      Fill rate: {item.product.fillRate}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Vertical Risk Bar */}
                              <div className="flex gap-2 items-center">
                                <div className="w-2 h-12 bg-glacier-200 rounded-full overflow-hidden">
                                  <div className="w-full bg-amber-500 h-3/4" />
                                </div>
                                <span className="text-caption text-glacier-600">
                                  High supply risk detected
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Substitution Options */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-caption text-glacier-600 font-semibold uppercase">
                                Better Alternatives
                              </span>
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-caption rounded-full border border-green-200">
                                {substitutions.length} options
                              </span>
                            </div>

                            <div className="space-y-3">
                              {substitutions.map((sub, index) => (
                                <motion.div
                                  key={sub.id}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`bg-white border-2 rounded-soft-lg p-4 cursor-pointer transition-all ${
                                    sub.tier === 'best'
                                      ? 'border-green-400 ring-2 ring-green-100'
                                      : sub.tier === 'better'
                                      ? 'border-valio-300'
                                      : 'border-glacier-300'
                                  } hover:shadow-soft-md`}
                                  whileHover={{ scale: 1.02 }}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex gap-2 items-center">
                                      <div className="w-12 h-12 bg-glacier-100 rounded overflow-hidden">
                                        <img
                                          src={sub.substituteProduct.imageUrl}
                                          alt={sub.substituteProduct.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div>
                                        <h5 className="font-medium text-glacier-900 text-sm">
                                          {sub.substituteProduct.name}
                                        </h5>
                                        <p className="text-caption text-glacier-600">
                                          {formatCurrency(sub.substituteProduct.price)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className={`px-2 py-1 rounded text-label font-bold uppercase ${
                                      sub.tier === 'best'
                                        ? 'bg-green-100 text-green-700'
                                        : sub.tier === 'better'
                                        ? 'bg-valio-100 text-valio-700'
                                        : 'bg-glacier-100 text-glacier-700'
                                    }`}>
                                      {sub.tier}
                                    </div>
                                  </div>

                                  <div className="space-y-1 mb-3">
                                    {sub.differences.map((diff, i) => (
                                      <div key={i} className="flex items-center gap-2 text-caption text-glacier-700">
                                        <Check className="w-3 h-3 text-green-600" />
                                        <span>{diff}</span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-caption text-glacier-600">Similarity:</span>
                                      <span className={`font-semibold ${getSimilarityColor(sub.similarity)}`}>
                                        {sub.similarity}%
                                      </span>
                                    </div>
                                    <RiskBadge level={sub.availabilityLevel} />
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-glacier-200">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAction(item.id, 'replace')}
                          >
                            Replace with Best Option
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAction(item.id, 'keep')}
                          >
                            Keep Original
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(item.id, 'remove')}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Critical Risk Alerts */}
            {criticalRiskItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="text-heading text-glacier-900">
                    Critical Risk Alerts
                  </h3>
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 text-caption rounded-full">
                    {criticalRiskItems.length} items need attention
                  </span>
                </div>

                <div className="space-y-4">
                  {criticalRiskItems.map((item) => (
                    <Card key={item.id} className="!p-6 border-2 border-red-200 bg-red-50/30">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-soft">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 mb-2">
                            Critical Product at Risk: {item.product.name}
                          </h4>
                          <p className="text-body-sm text-red-800 mb-4">
                            This critical item has a high supply risk (fill rate: {item.product.fillRate}%).
                            Supplier delays detected in the last 7 days.
                          </p>

                          <div className="space-y-2">
                            <Button variant="primary" size="sm">
                              Call me now to discuss alternatives
                            </Button>
                            <p className="text-caption text-red-700">
                              Our team can help you find the best solution
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-glacier-200 bg-glacier-50 flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                Keep Original Order
              </Button>
              <Button variant="primary" onClick={onAcceptAll}>
                <Check className="w-4 h-4" />
                Accept All Smart Changes
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

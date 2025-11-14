'use client';

import { OrderItem, Priority } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Minus, Plus, Trash2, AlertTriangle, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartBasketProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onUpdatePriority: (itemId: string, priority: Priority) => void;
  onRemoveItem: (itemId: string) => void;
  onProceed: () => void;
}

export function SmartBasket({
  items,
  onUpdateQuantity,
  onUpdatePriority,
  onRemoveItem,
  onProceed,
}: SmartBasketProps) {
  const totalValue = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const riskCount = items.filter(item => item.riskLevel === 'high').length;
  const criticalAtRisk = items.filter(
    item => item.priority === 'critical' && item.riskLevel === 'high'
  ).length;

  const getItemBackgroundColor = (item: OrderItem) => {
    if (item.priority === 'critical' && item.riskLevel === 'high') {
      return 'bg-red-50/70';
    }
    if (item.priority === 'flexible' && item.riskLevel === 'high') {
      return 'bg-amber-50/70';
    }
    return 'bg-white';
  };

  return (
    <Card className="!p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-glacier-200 bg-gradient-to-r from-valio-50 to-white">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-5 h-5 text-valio-600" />
          <h2 className="text-heading text-glacier-900">Smart Basket</h2>
        </div>
        <p className="text-body-sm text-glacier-600">
          AI-powered risk awareness
        </p>
      </div>

      {/* Items List */}
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-glacier-300 mx-auto mb-3" />
            <p className="text-body text-glacier-500">Your basket is empty</p>
            <p className="text-body-sm text-glacier-400 mt-1">
              Add products to get started
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className={`p-3 rounded-soft border border-glacier-200 ${getItemBackgroundColor(item)}`}
                >
                  {/* Product Info */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 bg-glacier-100 rounded flex-shrink-0 overflow-hidden">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-glacier-900 text-sm mb-1 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-caption text-glacier-600">
                        {formatCurrency(item.product.price)} × {item.quantity} ={' '}
                        <span className="font-semibold">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-glacier-100 hover:bg-glacier-200 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-glacier-700" />
                    </button>
                    <span className="w-8 text-center font-medium text-glacier-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-glacier-100 hover:bg-glacier-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-glacier-700" />
                    </button>
                  </div>

                  {/* Priority Selector */}
                  <div className="mb-2">
                    <label className="block text-label text-glacier-700 mb-1">
                      PRIORITY
                    </label>
                    <select
                      value={item.priority}
                      onChange={(e) => onUpdatePriority(item.id, e.target.value as Priority)}
                      className="w-full px-2 py-1 text-caption bg-white border border-glacier-300 rounded focus:outline-none focus:ring-2 focus:ring-valio-500"
                    >
                      <option value="critical">Critical</option>
                      <option value="important">Important</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  {/* Risk Badge */}
                  <div className="flex items-center justify-between">
                    <RiskBadge level={item.riskLevel} />
                    {item.riskLevel === 'high' && (
                      <button className="text-caption text-valio-700 hover:text-valio-800 font-medium">
                        View Alternatives →
                      </button>
                    )}
                  </div>

                  {/* Warning for Critical + High Risk */}
                  {item.priority === 'critical' && item.riskLevel === 'high' && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-caption text-red-800 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>Critical item at high risk</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Summary & CTA */}
      {items.length > 0 && (
        <div className="p-4 border-t border-glacier-200 bg-glacier-50">
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-glacier-600">Items</span>
              <span className="font-medium text-glacier-900">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-glacier-600">Estimated value</span>
              <span className="font-medium text-glacier-900">{formatCurrency(totalValue)}</span>
            </div>
            {riskCount > 0 && (
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-amber-700">High-risk items</span>
                <span className="font-semibold text-amber-700">{riskCount}</span>
              </div>
            )}
            {criticalAtRisk > 0 && (
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-red-700">Critical at risk</span>
                <span className="font-semibold text-red-700">{criticalAtRisk}</span>
              </div>
            )}
          </div>

          <Button
            onClick={onProceed}
            className="w-full"
            disabled={items.length === 0}
          >
            {riskCount > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                Review Risks & Alternatives
              </>
            ) : (
              'Proceed to Checkout'
            )}
          </Button>

          {riskCount > 0 && (
            <p className="text-caption text-center text-amber-700 mt-2">
              {riskCount} item{riskCount > 1 ? 's' : ''} may need attention
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

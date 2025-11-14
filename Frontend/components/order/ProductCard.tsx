'use client';

import { Product } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatCurrency, getTemperatureZoneEmoji } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  onAddToBasket: (productId: string) => void;
}

export function ProductCard({ product, viewMode, onAddToBasket }: ProductCardProps) {
  const hasSaferAlternative = product.riskLevel === 'high';

  if (viewMode === 'list') {
    return (
      <Card className="!p-4" hover>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-glacier-100 rounded flex-shrink-0 overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-semibold text-glacier-900">
                {product.name}
              </h3>
              <span className="font-bold text-glacier-900 whitespace-nowrap">
                {formatCurrency(product.price)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-body-sm text-glacier-600">
                {product.packSize} • {product.category}
              </span>
              <span>{getTemperatureZoneEmoji(product.temperatureZone)}</span>
            </div>

            <div className="flex items-center gap-2">
              <RiskBadge level={product.riskLevel} />
              {product.nutritionBadges.map(badge => (
                <span
                  key={badge}
                  className="px-2 py-0.5 bg-green-50 text-green-700 text-caption rounded border border-green-200"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <Button onClick={() => onAddToBasket(product.id)} size="sm">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        {hasSaferAlternative && (
          <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50/50 -mx-4 -mb-4 px-4 py-2 rounded-b-soft-lg">
            <p className="text-body-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Safer option available
            </p>
          </div>
        )}
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="!p-0 overflow-hidden relative" hover>
        {/* Safer Alternative Ribbon */}
        {hasSaferAlternative && (
          <div className="absolute top-3 left-0 bg-amber-500 text-white text-caption font-medium px-3 py-1 shadow-md z-10">
            Safer option available
          </div>
        )}

        {/* Product Image */}
        <div className="relative h-48 bg-glacier-100 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <RiskBadge level={product.riskLevel} pulse={product.riskLevel === 'high'} />
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-glacier-900 line-clamp-2">
                {product.name}
              </h3>
              <span>{getTemperatureZoneEmoji(product.temperatureZone)}</span>
            </div>

            <p className="text-body-sm text-glacier-600 mb-2">
              {product.packSize}
            </p>

            <div className="flex flex-wrap gap-1 mb-3">
              {product.nutritionBadges.map(badge => (
                <span
                  key={badge}
                  className="px-2 py-0.5 bg-green-50 text-green-700 text-caption rounded border border-green-200"
                >
                  {badge}
                </span>
              ))}
              {product.allergens.length > 0 && (
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 text-caption rounded border border-red-200 cursor-help">
                        Contains allergens
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-glacier-900 text-white px-3 py-2 rounded text-caption max-w-xs"
                        sideOffset={5}
                      >
                        {product.allergens.join(', ')}
                        <Tooltip.Arrow className="fill-glacier-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              )}
            </div>

            {product.riskLevel !== 'low' && (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <p className="text-caption text-glacier-500 cursor-help">
                      Last 7 days fill rate: {product.fillRate}%
                    </p>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-glacier-900 text-white px-3 py-2 rounded text-caption max-w-xs"
                      sideOffset={5}
                    >
                      {product.riskLevel === 'high'
                        ? 'Supplier delay detected. Fill rate below 65%.'
                        : 'Moderate supply risk. Fill rate below 85%.'}
                      <Tooltip.Arrow className="fill-glacier-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-glacier-200">
            <span className="text-xl font-bold text-glacier-900">
              {formatCurrency(product.price)}
            </span>
            <Button onClick={() => onAddToBasket(product.id)} size="sm">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

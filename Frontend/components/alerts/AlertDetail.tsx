'use client';

import { TimelineEvent, Product } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Package, CheckCircle, XCircle, MessageSquare, Phone, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface AlertDetailProps {
  event: TimelineEvent | null;
  product: Product;
}

export function AlertDetail({ event, product }: AlertDetailProps) {
  if (!event) {
    return (
      <Card className="!p-12 text-center">
        <Package className="w-16 h-16 text-glacier-300 mx-auto mb-4" />
        <h3 className="text-heading text-glacier-900 mb-2">
          Select an event
        </h3>
        <p className="text-body text-glacier-600">
          Click on a timeline event to view details
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Event Header */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-heading text-glacier-900 mb-2">
              {event.title}
            </h2>
            <p className="text-body text-glacier-600">
              {event.description}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-body-sm text-glacier-600 mb-1">
              <Clock className="w-4 h-4" />
              {formatDateTime(event.timestamp)}
            </div>
            {event.type === 'success' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-caption rounded-full border border-green-200">
                <CheckCircle className="w-3 h-3" />
                Resolved
              </span>
            )}
            {event.type === 'warning' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-caption rounded-full border border-amber-200">
                <Package className="w-3 h-3" />
                In Progress
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Product Details */}
      {event.type === 'warning' && (
        <Card>
          <h3 className="text-heading text-glacier-900 mb-4">Product Details</h3>

          <div className="flex gap-4 p-4 bg-glacier-50 rounded-soft-lg border border-glacier-200">
            <div className="w-24 h-24 bg-white rounded-soft overflow-hidden flex-shrink-0">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-glacier-900 mb-2">
                {product.name}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-body-sm">
                <div>
                  <span className="text-glacier-600">Ordered:</span>
                  <span className="ml-2 font-medium text-glacier-900">10 units</span>
                </div>
                <div>
                  <span className="text-glacier-600">Picked:</span>
                  <span className="ml-2 font-medium text-red-700">4 units</span>
                </div>
                <div>
                  <span className="text-glacier-600">Price:</span>
                  <span className="ml-2 font-medium text-glacier-900">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <div>
                  <span className="text-glacier-600">Risk:</span>
                  <span className="ml-2 font-medium text-amber-700">
                    Was predicted high-risk
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-soft">
            <p className="text-body-sm text-amber-800">
              <strong>Shortage detected:</strong> Only 4 of 10 units available due to supplier delay.
              This item was predicted as high-risk during order placement.
            </p>
          </div>
        </Card>
      )}

      {/* Voice/Chat Transcript */}
      {event.type === 'success' && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-valio-600" />
            <h3 className="text-heading text-glacier-900">Communication Transcript</h3>
          </div>

          <div className="space-y-3">
            {/* AI Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-valio-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-caption font-semibold text-valio-700">AI</span>
              </div>
              <div className="flex-1 bg-valio-50 p-3 rounded-soft-lg border border-valio-200">
                <p className="text-body-sm text-glacier-900">
                  "We found only 4 of 10 items for your {product.name}. Would you like us to send Oat Drink 1L instead? It's 95% similar and has better availability."
                </p>
                <p className="text-caption text-glacier-500 mt-1">3:16 AM</p>
              </div>
            </div>

            {/* Customer Message */}
            <div className="flex gap-3 justify-end">
              <div className="flex-1 max-w-md bg-glacier-100 p-3 rounded-soft-lg border border-glacier-200">
                <p className="text-body-sm text-glacier-900">
                  "Yes, send the Oat Drink instead. That works perfectly."
                </p>
                <p className="text-caption text-glacier-500 mt-1 text-right">3:16 AM</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-700" />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      {event.type === 'warning' && (
        <Card className="bg-gradient-to-r from-valio-50 to-white">
          <h3 className="text-heading text-glacier-900 mb-4">Quick Actions</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="primary" className="w-full">
              <CheckCircle className="w-4 h-4" />
              Accept Substitute
            </Button>
            <Button variant="secondary" className="w-full">
              <Package className="w-4 h-4" />
              Deliver Partial
            </Button>
            <Button variant="ghost" className="w-full border border-glacier-300">
              <XCircle className="w-4 h-4" />
              Cancel Item
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-glacier-200">
            <Button variant="ghost" className="w-full">
              <Phone className="w-4 h-4" />
              Call me to discuss options
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

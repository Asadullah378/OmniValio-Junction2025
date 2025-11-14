'use client';

import { Claim } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Calendar, Package, Bot, Eye, Download, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useState } from 'react';

interface ClaimDetailProps {
  claim: Claim | null;
}

export function ClaimDetail({ claim }: ClaimDetailProps) {
  const [showAIOverlay, setShowAIOverlay] = useState(false);

  if (!claim) {
    return (
      <Card className="!p-12 text-center">
        <Package className="w-16 h-16 text-glacier-300 mx-auto mb-4" />
        <h3 className="text-heading text-glacier-900 mb-2">
          Select a claim
        </h3>
        <p className="text-body text-glacier-600">
          Choose a claim from the list to view details
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      key={claim.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Claim Overview */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-heading text-glacier-900">
                Claim #{claim.id}
              </h2>
              {claim.aiHandled && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-valio-50 text-valio-700 text-caption rounded-full border border-valio-200">
                  <Bot className="w-3 h-3" />
                  AI Handled
                </span>
              )}
            </div>
            <p className="text-body text-glacier-600">
              Order #{claim.orderId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-caption text-glacier-500 mb-1">Created</p>
            <p className="text-body-sm font-medium text-glacier-900">
              {formatDateTime(claim.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-glacier-50 rounded-soft">
            <p className="text-caption text-glacier-600 mb-1">Issue Type</p>
            <p className="font-medium text-glacier-900">{claim.issueType}</p>
          </div>
          <div className="p-3 bg-glacier-50 rounded-soft">
            <p className="text-caption text-glacier-600 mb-1">Status</p>
            <p className="font-medium text-glacier-900 capitalize">{claim.status}</p>
          </div>
          <div className="p-3 bg-glacier-50 rounded-soft">
            <p className="text-caption text-glacier-600 mb-1">Items Affected</p>
            <p className="font-medium text-glacier-900">{claim.items.length}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t border-glacier-200 pt-4">
          <h3 className="text-body-sm font-semibold text-glacier-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-body-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-glacier-600">Claim opened</span>
              <span className="text-glacier-400">•</span>
              <span className="text-glacier-500">{formatDateTime(claim.createdAt)}</span>
            </div>
            {claim.status !== 'pending' && (
              <div className="flex items-center gap-3 text-body-sm">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-glacier-600">AI analyzed evidence</span>
                <span className="text-glacier-400">•</span>
                <span className="text-glacier-500">
                  {formatDateTime(new Date(new Date(claim.createdAt).getTime() + 1800000).toISOString())}
                </span>
              </div>
            )}
            {claim.resolvedAt && (
              <div className="flex items-center gap-3 text-body-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-glacier-600">Claim resolved</span>
                <span className="text-glacier-400">•</span>
                <span className="text-glacier-500">{formatDateTime(claim.resolvedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Affected Items */}
      <Card>
        <h3 className="text-heading text-glacier-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Affected Items
        </h3>

        <div className="space-y-3">
          {claim.items.map((item, index) => (
            <div
              key={index}
              className="flex gap-4 p-4 bg-glacier-50 rounded-soft-lg border border-glacier-200"
            >
              <div className="w-16 h-16 bg-white rounded overflow-hidden flex-shrink-0">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-glacier-900 mb-1">
                  {item.product.name}
                </h4>
                <p className="text-body-sm text-glacier-600 mb-2">
                  Quantity: {item.quantity}
                </p>
                <p className="text-caption text-red-700 bg-red-50 inline-block px-2 py-1 rounded border border-red-200">
                  {item.reportedIssue}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Evidence Viewer */}
      {claim.evidence.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-heading text-glacier-900 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Evidence
            </h3>
            <button
              onClick={() => setShowAIOverlay(!showAIOverlay)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-soft text-caption font-medium transition-all ${
                showAIOverlay
                  ? 'bg-valio-600 text-white'
                  : 'bg-valio-50 text-valio-700 hover:bg-valio-100'
              }`}
            >
              <Bot className="w-3 h-3" />
              {showAIOverlay ? 'Hide AI Analysis' : 'See what AI sees'}
            </button>
          </div>

          <div className="space-y-4">
            {claim.evidence.map((evidence, index) => (
              <div key={index} className="relative">
                <div className="relative bg-glacier-100 rounded-soft-lg overflow-hidden">
                  <img
                    src={evidence.imageUrl}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-auto"
                  />

                  {/* AI Overlay */}
                  {showAIOverlay && evidence.aiDetections && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-valio-900/75 backdrop-blur-sm p-6 flex flex-col justify-end"
                    >
                      <div className="bg-white/95 rounded-soft-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="w-5 h-5 text-valio-600" />
                          <span className="font-semibold text-glacier-900">
                            AI Analysis
                          </span>
                          {evidence.aiConfidence && (
                            <span className="ml-auto px-2 py-0.5 bg-green-50 text-green-700 text-caption rounded-full border border-green-200">
                              {evidence.aiConfidence}% confidence
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {evidence.aiDetections.map((detection, i) => (
                            <div key={i} className="flex items-center gap-2 text-body-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-glacier-900">{detection}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {!showAIOverlay && evidence.aiConfidence && (
                  <div className="mt-2 flex items-center justify-between text-caption text-glacier-600">
                    <span>AI Confidence: {evidence.aiConfidence}%</span>
                    <span>{evidence.aiDetections?.length || 0} detections</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resolution */}
      {claim.resolution && (
        <Card className="bg-gradient-to-r from-green-50 to-white border-2 border-green-200">
          <h3 className="text-heading text-glacier-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Resolution
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-white rounded-soft-lg border border-green-200">
              <p className="text-caption text-glacier-600 mb-1">Credit Amount</p>
              <p className="text-display-lg text-green-700 font-bold">
                {formatCurrency(claim.resolution.creditAmount)}
              </p>
            </div>

            {claim.resolution.redeliveryScheduled && (
              <div className="p-4 bg-white rounded-soft-lg border border-green-200">
                <p className="text-caption text-glacier-600 mb-1">Redelivery Scheduled</p>
                <p className="text-body font-medium text-glacier-900">
                  {formatDateTime(claim.resolution.redeliveryScheduled)}
                </p>
              </div>
            )}
          </div>

          <Button variant="primary" className="w-full sm:w-auto">
            <Download className="w-4 h-4" />
            Download Credit Note PDF
          </Button>
        </Card>
      )}
    </motion.div>
  );
}

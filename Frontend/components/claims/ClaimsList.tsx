'use client';

import { Claim, ClaimStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { FileText, Bot } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface ClaimsListProps {
  claims: Claim[];
  selectedClaim: Claim | null;
  onSelectClaim: (claim: Claim) => void;
}

export function ClaimsList({ claims, selectedClaim, onSelectClaim }: ClaimsListProps) {
  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in-review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-glacier-50 text-glacier-700 border-glacier-200';
    }
  };

  const getStatusLabel = (status: ClaimStatus) => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'in-review':
        return 'In Review';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <Card className="!p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-glacier-200 bg-gradient-to-r from-valio-50 to-white">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-5 h-5 text-valio-600" />
          <h2 className="text-heading text-glacier-900">Your Claims</h2>
        </div>
        <p className="text-caption text-glacier-600">
          {claims.length} total claim{claims.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Claims List */}
      <div className="divide-y divide-glacier-200">
        {claims.map((claim, index) => (
          <motion.button
            key={claim.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectClaim(claim)}
            className={`w-full text-left p-4 transition-all ${
              selectedClaim?.id === claim.id
                ? 'bg-valio-50 border-l-4 border-l-valio-600'
                : 'hover:bg-glacier-50 border-l-4 border-l-transparent'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-glacier-900">
                    #{claim.id}
                  </span>
                  {claim.aiHandled && (
                    <div className="p-1 bg-valio-100 rounded">
                      <Bot className="w-3 h-3 text-valio-700" />
                    </div>
                  )}
                </div>
                <p className="text-caption text-glacier-600 mb-2">
                  Order #{claim.orderId}
                </p>
              </div>
            </div>

            <p className="text-body-sm text-glacier-900 font-medium mb-2">
              {claim.issueType}
            </p>

            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-caption border ${getStatusColor(claim.status)}`}>
                {getStatusLabel(claim.status)}
              </span>
              <span className="text-caption text-glacier-500">
                {formatDateTime(claim.createdAt).split(',')[0]}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {claims.length === 0 && (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-glacier-300 mx-auto mb-3" />
          <p className="text-body text-glacier-500">No claims found</p>
        </div>
      )}
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { ClaimsList } from '@/components/claims/ClaimsList';
import { ClaimDetail } from '@/components/claims/ClaimDetail';
import { mockClaims } from '@/lib/mockData';
import { Claim } from '@/lib/types';

export default function ClaimsPage() {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(mockClaims[0]);

  return (
    <div className="min-h-screen bg-glacier-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-display-lg text-glacier-900 mb-2">
            Claims & Credits
          </h1>
          <p className="text-body text-glacier-600">
            Track and resolve delivery issues with AI-powered analysis
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Claims List */}
          <div className="lg:col-span-1">
            <ClaimsList
              claims={mockClaims}
              selectedClaim={selectedClaim}
              onSelectClaim={setSelectedClaim}
            />
          </div>

          {/* Right Column - Claim Detail */}
          <div className="lg:col-span-2">
            <ClaimDetail claim={selectedClaim} />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { HeroSummary } from '@/components/dashboard/HeroSummary';
import { DeliveriesList } from '@/components/dashboard/DeliveriesList';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { mockStats, mockDeliveries, mockAlerts } from '@/lib/mockData';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-glacier-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-display-lg text-glacier-900 mb-2">
            Today at a Glance
          </h1>
          <p className="text-body text-glacier-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Hero Summary Card */}
        <HeroSummary stats={mockStats} />

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Deliveries (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <DeliveriesList deliveries={mockDeliveries} />
          </div>

          {/* Right Column - Action Center (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            <ActionCenter alerts={mockAlerts} />
          </div>
        </div>
      </div>
    </div>
  );
}

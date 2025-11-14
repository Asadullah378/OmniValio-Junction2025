'use client';

import { useState } from 'react';
import { LiveTimeline } from '@/components/alerts/LiveTimeline';
import { AlertDetail } from '@/components/alerts/AlertDetail';
import { mockTimelineEvents, mockProducts } from '@/lib/mockData';
import { TimelineEvent } from '@/lib/types';

export default function AlertsPage() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(mockTimelineEvents[1]);

  return (
    <div className="min-h-screen bg-glacier-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-display-lg text-glacier-900 mb-2">
            Real-Time Picking Alerts
          </h1>
          <p className="text-body text-glacier-600">
            Monitor warehouse operations and resolve issues in real-time
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Live Timeline */}
          <div className="lg:col-span-1">
            <LiveTimeline
              events={mockTimelineEvents}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
            />
          </div>

          {/* Right Column - Alert Detail */}
          <div className="lg:col-span-2">
            <AlertDetail
              event={selectedEvent}
              product={mockProducts[0]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

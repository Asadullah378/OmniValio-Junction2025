'use client';

import { TimelineEvent } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Clock, Radio } from 'lucide-react';
import { formatTime, getRelativeTime } from '@/lib/utils';

interface LiveTimelineProps {
  events: TimelineEvent[];
  selectedEvent: TimelineEvent | null;
  onSelectEvent: (event: TimelineEvent) => void;
}

export function LiveTimeline({ events, selectedEvent, onSelectEvent }: LiveTimelineProps) {
  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-valio-500';
    }
  };

  const getEventBorderColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200';
      case 'warning':
        return 'border-amber-200';
      case 'error':
        return 'border-red-200';
      default:
        return 'border-valio-200';
    }
  };

  return (
    <Card className="!p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-glacier-200 bg-gradient-to-r from-valio-50 to-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <Radio className="w-5 h-5 text-valio-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-heading text-glacier-900">Live Timeline</h2>
        </div>
        <p className="text-caption text-glacier-600">
          Real-time warehouse updates
        </p>
      </div>

      {/* Timeline */}
      <div className="p-4">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-glacier-200" />

          {/* Events */}
          <div className="space-y-4">
            {events.map((event, index) => (
              <motion.button
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelectEvent(event)}
                className={`relative w-full text-left pl-14 pr-4 py-3 rounded-soft transition-all ${
                  selectedEvent?.id === event.id
                    ? `bg-glacier-100 border-2 ${getEventBorderColor(event.type)}`
                    : 'hover:bg-glacier-50 border-2 border-transparent'
                }`}
              >
                {/* Node */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className={`w-4 h-4 rounded-full ${getEventColor(event.type)} ring-4 ring-white`}>
                    {index === 0 && (
                      <motion.div
                        className={`w-full h-full rounded-full ${getEventColor(event.type)}`}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [1, 0, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-glacier-500" />
                    <span className="text-caption text-glacier-600">
                      {formatTime(event.timestamp)}
                    </span>
                    <span className="text-caption text-glacier-400">•</span>
                    <span className="text-caption text-glacier-500">
                      {getRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-glacier-900 text-sm mb-1">
                    {event.title}
                  </h4>
                  <p className="text-caption text-glacier-600 line-clamp-2">
                    {event.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

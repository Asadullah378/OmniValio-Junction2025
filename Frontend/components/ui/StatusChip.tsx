'use client';

import { DeliveryStatus } from '@/lib/types';

interface StatusChipProps {
  status: DeliveryStatus;
  className?: string;
}

export function StatusChip({ status, className = '' }: StatusChipProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'on-track':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'at-risk':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'shortage-detected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'on-track':
        return '🟢';
      case 'at-risk':
        return '🟡';
      case 'shortage-detected':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'Risk Predicted';
      case 'shortage-detected':
        return 'Shortage Detected';
      default:
        return 'Unknown';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium border ${getStatusStyles()} ${className}`}>
      <span>{getStatusIcon()}</span>
      <span>{getStatusLabel()}</span>
    </span>
  );
}

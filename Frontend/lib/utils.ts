import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RiskLevel } from "./types";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get risk color classes based on risk level
 */
export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'medium':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'high':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

/**
 * Get risk emoji indicator
 */
export function getRiskEmoji(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🔴';
    default:
      return '⚪';
  }
}

/**
 * Format currency in EUR
 */
export function formatCurrency(amount: number, locale: string = 'en-FI'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date, locale: string = 'en-FI'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dateObj);
}

/**
 * Format time only
 */
export function formatTime(date: string | Date, locale: string = 'en-FI'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    timeStyle: 'short',
  }).format(dateObj);
}

/**
 * Calculate relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date, locale: string = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDateTime(dateObj, locale);
}

/**
 * Generate a random ID
 */
export function generateId(prefix: string = ''): string {
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${random}` : random;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get temperature zone icon/emoji
 */
export function getTemperatureZoneEmoji(zone: string): string {
  switch (zone.toLowerCase()) {
    case 'frozen':
      return '❄️';
    case 'chilled':
      return '🧊';
    case 'ambient':
      return '🌡️';
    default:
      return '📦';
  }
}

/**
 * Calculate similarity percentage color
 */
export function getSimilarityColor(similarity: number): string {
  if (similarity >= 90) return 'text-green-700';
  if (similarity >= 70) return 'text-amber-700';
  return 'text-red-700';
}

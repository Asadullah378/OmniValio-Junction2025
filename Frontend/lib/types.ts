// Core types for Omni-Valio application

export type RiskLevel = 'low' | 'medium' | 'high';
export type Priority = 'critical' | 'important' | 'flexible';
export type DeliveryStatus = 'on-track' | 'at-risk' | 'shortage-detected';
export type Language = 'FI' | 'SV' | 'EN';
export type TemperatureZone = 'ambient' | 'chilled' | 'frozen';
export type ClaimStatus = 'pending' | 'in-review' | 'resolved' | 'rejected';
export type CommunicationChannel = 'voice' | 'sms' | 'email' | 'chatbot';

export interface Product {
  id: string;
  name: string;
  packSize: string;
  price: number;
  imageUrl: string;
  category: string;
  allergens: string[];
  temperatureZone: TemperatureZone;
  riskLevel: RiskLevel;
  fillRate: number; // Last 7 days fill rate percentage
  nutritionBadges: string[];
  description: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  priority: Priority;
  riskLevel: RiskLevel;
}

export interface Substitution {
  id: string;
  originalProduct: Product;
  substituteProduct: Product;
  tier: 'good' | 'better' | 'best';
  similarity: number; // 0-100
  differences: string[];
  availabilityLevel: RiskLevel;
}

export interface Delivery {
  id: string;
  routeNumber: string;
  timeWindow: string;
  status: DeliveryStatus;
  items: OrderItem[];
  estimatedArrival?: string;
  atRiskItemsCount: number;
}

export interface Alert {
  id: string;
  type: 'shortage' | 'substitution' | 'credit' | 'delivery-delay';
  severity: RiskLevel;
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
  relatedDeliveryId?: string;
  relatedProductId?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'error';
  metadata?: Record<string, any>;
}

export interface Claim {
  id: string;
  orderId: string;
  issueType: string;
  status: ClaimStatus;
  createdAt: string;
  resolvedAt?: string;
  aiHandled: boolean;
  items: {
    product: Product;
    reportedIssue: string;
    quantity: number;
  }[];
  evidence: {
    imageUrl: string;
    aiConfidence?: number;
    aiDetections?: string[];
  }[];
  resolution?: {
    creditAmount: number;
    redeliveryScheduled?: string;
  };
}

export interface UserPreferences {
  restaurantName: string;
  deliveryAddress: string;
  language: Language;
  communicationChannel: CommunicationChannel;
  doNotCallBefore: string;
  autoSubstituteFlexible: boolean;
  sendRiskyOrderReminders: boolean;
  allergenRestrictions: string[];
  categoryPriorities: Record<string, Priority>;
}

export interface DashboardStats {
  deliveriesToday: number;
  atRiskItems: number;
  unresolvedAlerts: number;
  aiActionsCount: number;
}

import {
  Product,
  OrderItem,
  Delivery,
  Alert,
  Claim,
  DashboardStats,
  Substitution,
  TimelineEvent,
  UserPreferences,
  RiskLevel,
  Priority,
} from './types';

// Product categories and data
const categories = [
  'Dairy',
  'Vegetables',
  'Meat',
  'Bakery',
  'Beverages',
  'Frozen Foods',
  'Dry Goods',
];

const allergens = [
  'Milk',
  'Eggs',
  'Gluten',
  'Nuts',
  'Soy',
  'Fish',
  'Shellfish',
];

const productNames = [
  { name: 'Valio Milk 1L', category: 'Dairy', zone: 'chilled', allergens: ['Milk'] },
  { name: 'Valio Butter 500g', category: 'Dairy', zone: 'chilled', allergens: ['Milk'] },
  { name: 'Valio Cream 2dl', category: 'Dairy', zone: 'chilled', allergens: ['Milk'] },
  { name: 'Valio Cheese Block 1kg', category: 'Dairy', zone: 'chilled', allergens: ['Milk'] },
  { name: 'Valio Yogurt 1kg', category: 'Dairy', zone: 'chilled', allergens: ['Milk'] },
  { name: 'Oat Drink 1L', category: 'Beverages', zone: 'chilled', allergens: [] },
  { name: 'Fresh Tomatoes 5kg', category: 'Vegetables', zone: 'ambient', allergens: [] },
  { name: 'Potatoes 10kg', category: 'Vegetables', zone: 'ambient', allergens: [] },
  { name: 'Fresh Lettuce Box', category: 'Vegetables', zone: 'chilled', allergens: [] },
  { name: 'Chicken Breast 5kg', category: 'Meat', zone: 'chilled', allergens: [] },
  { name: 'Beef Mince 3kg', category: 'Meat', zone: 'chilled', allergens: [] },
  { name: 'Salmon Fillet 2kg', category: 'Meat', zone: 'frozen', allergens: ['Fish'] },
  { name: 'Fresh Bread Loaves (10)', category: 'Bakery', zone: 'ambient', allergens: ['Gluten'] },
  { name: 'Croissants (20)', category: 'Bakery', zone: 'ambient', allergens: ['Gluten', 'Eggs', 'Milk'] },
  { name: 'Orange Juice 1L', category: 'Beverages', zone: 'chilled', allergens: [] },
  { name: 'Coffee Beans 1kg', category: 'Dry Goods', zone: 'ambient', allergens: [] },
  { name: 'Pasta 5kg', category: 'Dry Goods', zone: 'ambient', allergens: ['Gluten'] },
  { name: 'Rice 10kg', category: 'Dry Goods', zone: 'ambient', allergens: [] },
  { name: 'Frozen Vegetables 2kg', category: 'Frozen Foods', zone: 'frozen', allergens: [] },
  { name: 'Ice Cream Tub 5L', category: 'Frozen Foods', zone: 'frozen', allergens: ['Milk', 'Eggs'] },
];

// Generate mock products
export function generateMockProducts(): Product[] {
  return productNames.map((item, index) => {
    const fillRate = Math.random() * 100;
    let riskLevel: RiskLevel = 'low';

    if (fillRate < 65) {
      riskLevel = 'high';
    } else if (fillRate < 85) {
      riskLevel = 'medium';
    }

    return {
      id: `prod-${index + 1}`,
      name: item.name,
      packSize: '1 unit',
      price: Math.floor(Math.random() * 50) + 10,
      imageUrl: `https://via.placeholder.com/200x200/0ea5e9/ffffff?text=${encodeURIComponent(item.name.split(' ')[0])}`,
      category: item.category,
      allergens: item.allergens,
      temperatureZone: item.zone as any,
      riskLevel,
      fillRate: Math.round(fillRate),
      nutritionBadges: Math.random() > 0.5 ? ['Organic', 'Local'] : [],
      description: `Premium quality ${item.name} from trusted suppliers.`,
    };
  });
}

// Generate mock order items
export function generateMockOrderItems(products: Product[], count: number = 5): OrderItem[] {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  return selected.map((product, index) => ({
    id: `item-${index + 1}`,
    product,
    quantity: Math.floor(Math.random() * 10) + 1,
    priority: ['critical', 'important', 'flexible'][Math.floor(Math.random() * 3)] as Priority,
    riskLevel: product.riskLevel,
  }));
}

// Generate mock deliveries
export function generateMockDeliveries(products: Product[]): Delivery[] {
  const timeWindows = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00'];

  return timeWindows.slice(0, 2).map((window, index) => {
    const items = generateMockOrderItems(products, Math.floor(Math.random() * 6) + 3);
    const atRiskItemsCount = items.filter(item => item.riskLevel === 'high').length;

    let status: any = 'on-track';
    if (atRiskItemsCount > 2) {
      status = 'shortage-detected';
    } else if (atRiskItemsCount > 0) {
      status = 'at-risk';
    }

    return {
      id: `delivery-${index + 1}`,
      routeNumber: `R${100 + index}`,
      timeWindow: window,
      status,
      items,
      estimatedArrival: index === 0 ? '08:45' : undefined,
      atRiskItemsCount,
    };
  });
}

// Generate mock alerts
export function generateMockAlerts(): Alert[] {
  const now = new Date();

  return [
    {
      id: 'alert-1',
      type: 'shortage',
      severity: 'high',
      title: 'Shortage detected for Valio Milk 1L',
      message: 'Only 4 of 10 units available. Action required.',
      timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
      actionRequired: true,
      relatedProductId: 'prod-1',
    },
    {
      id: 'alert-2',
      type: 'substitution',
      severity: 'medium',
      title: 'AI suggested safer alternatives',
      message: 'We found better alternatives for your flexible items.',
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
      actionRequired: true,
    },
    {
      id: 'alert-3',
      type: 'credit',
      severity: 'low',
      title: 'Credit note ready for confirmation',
      message: 'Your claim #1234 has been processed.',
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      actionRequired: false,
    },
  ];
}

// Generate dashboard stats
export function generateDashboardStats(): DashboardStats {
  return {
    deliveriesToday: 2,
    atRiskItems: 3,
    unresolvedAlerts: 1,
    aiActionsCount: 4,
  };
}

// Generate substitutions
export function generateSubstitutions(product: Product, allProducts: Product[]): Substitution[] {
  const sameCategory = allProducts.filter(
    p => p.category === product.category && p.id !== product.id && p.riskLevel !== 'high'
  );

  return sameCategory.slice(0, 3).map((substitute, index) => {
    const similarity = 95 - (index * 10);
    const tier = index === 0 ? 'best' : index === 1 ? 'better' : 'good';

    return {
      id: `sub-${product.id}-${substitute.id}`,
      originalProduct: product,
      substituteProduct: substitute,
      tier: tier as any,
      similarity,
      differences: [
        index === 0 ? 'Same pack size' : 'Slightly different pack size',
        'More stable supplier',
        `Fill rate: ${substitute.fillRate}%`,
      ],
      availabilityLevel: substitute.riskLevel,
    };
  });
}

// Generate timeline events
export function generateTimelineEvents(): TimelineEvent[] {
  const now = new Date();

  return [
    {
      id: 'event-1',
      timestamp: new Date(now.getTime() - 48 * 60000).toISOString(),
      title: 'Picking started',
      description: 'Warehouse team began picking your order',
      type: 'info',
    },
    {
      id: 'event-2',
      timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
      title: 'Shortage detected',
      description: 'Valio Milk 1L - only 4 of 10 available',
      type: 'warning',
    },
    {
      id: 'event-3',
      timestamp: new Date(now.getTime() - 44 * 60000).toISOString(),
      title: 'AI suggested substitute',
      description: 'Oat Drink 1L recommended as alternative',
      type: 'info',
    },
    {
      id: 'event-4',
      timestamp: new Date(now.getTime() - 43 * 60000).toISOString(),
      title: 'Customer accepted via voice call',
      description: 'Substitution approved',
      type: 'success',
    },
  ];
}

// Generate mock claims
export function generateMockClaims(products: Product[]): Claim[] {
  const now = new Date();

  return [
    {
      id: 'claim-1234',
      orderId: 'order-5678',
      issueType: 'Damaged items',
      status: 'in-review',
      createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      aiHandled: true,
      items: [
        {
          product: products[0],
          reportedIssue: 'Package damaged, leaking',
          quantity: 3,
        },
      ],
      evidence: [
        {
          imageUrl: 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Damaged+Package',
          aiConfidence: 94,
          aiDetections: ['Damaged packaging', 'Liquid leakage', '3 items affected'],
        },
      ],
      resolution: {
        creditAmount: 12.50,
        redeliveryScheduled: new Date(now.getTime() + 24 * 3600000).toISOString(),
      },
    },
    {
      id: 'claim-1235',
      orderId: 'order-5679',
      issueType: 'Missing items',
      status: 'resolved',
      createdAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      resolvedAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
      aiHandled: false,
      items: [
        {
          product: products[2],
          reportedIssue: 'Item not delivered',
          quantity: 5,
        },
      ],
      evidence: [],
      resolution: {
        creditAmount: 45.00,
      },
    },
  ];
}

// Generate user preferences
export function generateUserPreferences(): UserPreferences {
  return {
    restaurantName: 'Nordic Kitchen',
    deliveryAddress: 'Mannerheimintie 123, 00100 Helsinki',
    language: 'EN',
    communicationChannel: 'voice',
    doNotCallBefore: '08:00',
    autoSubstituteFlexible: true,
    sendRiskyOrderReminders: true,
    allergenRestrictions: ['Nuts', 'Shellfish'],
    categoryPriorities: {
      'Dairy': 'critical',
      'Meat': 'critical',
      'Vegetables': 'important',
      'Bakery': 'flexible',
      'Beverages': 'flexible',
    },
  };
}

// Export all mock data
export const mockProducts = generateMockProducts();
export const mockDeliveries = generateMockDeliveries(mockProducts);
export const mockAlerts = generateMockAlerts();
export const mockStats = generateDashboardStats();
export const mockTimelineEvents = generateTimelineEvents();
export const mockClaims = generateMockClaims(mockProducts);
export const mockUserPreferences = generateUserPreferences();

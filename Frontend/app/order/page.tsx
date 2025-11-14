'use client';

import { useState } from 'react';
import { ProductCatalogue } from '@/components/order/ProductCatalogue';
import { SmartBasket } from '@/components/order/SmartBasket';
import { OptimizationModal } from '@/components/order/OptimizationModal';
import { mockProducts } from '@/lib/mockData';
import { OrderItem } from '@/lib/types';

export default function OrderPage() {
  const [basketItems, setBasketItems] = useState<OrderItem[]>([]);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  const addToBasket = (productId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = basketItems.find(item => item.product.id === productId);

    if (existingItem) {
      setBasketItems(
        basketItems.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: OrderItem = {
        id: `item-${Date.now()}`,
        product,
        quantity: 1,
        priority: 'important',
        riskLevel: product.riskLevel,
      };
      setBasketItems([...basketItems, newItem]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setBasketItems(
      basketItems
        .map(item => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is OrderItem => item !== null)
    );
  };

  const updatePriority = (itemId: string, priority: OrderItem['priority']) => {
    setBasketItems(
      basketItems.map(item =>
        item.id === itemId ? { ...item, priority } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setBasketItems(basketItems.filter(item => item.id !== itemId));
  };

  const proceedToOptimization = () => {
    setShowOptimizationModal(true);
  };

  const handleAcceptAll = () => {
    // Logic to apply substitutions
    setShowOptimizationModal(false);
    alert('Smart changes applied! Order optimized.');
  };

  return (
    <div className="min-h-screen bg-glacier-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-display-lg text-glacier-900 mb-2">
            Smart Order Builder
          </h1>
          <p className="text-body text-glacier-600">
            Build your order with real-time risk awareness and AI-powered suggestions
          </p>
        </div>

        {/* Two-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Pane - Product Catalogue (2/3) */}
          <div className="lg:col-span-2">
            <ProductCatalogue products={mockProducts} onAddToBasket={addToBasket} />
          </div>

          {/* Right Pane - Smart Basket (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <SmartBasket
                items={basketItems}
                onUpdateQuantity={updateQuantity}
                onUpdatePriority={updatePriority}
                onRemoveItem={removeItem}
                onProceed={proceedToOptimization}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Modal */}
      <OptimizationModal
        isOpen={showOptimizationModal}
        items={basketItems}
        onClose={() => setShowOptimizationModal(false)}
        onAcceptAll={handleAcceptAll}
      />
    </div>
  );
}

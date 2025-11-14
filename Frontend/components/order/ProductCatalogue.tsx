'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProductCatalogueProps {
  products: Product[];
  onAddToBasket: (productId: string) => void;
}

export function ProductCatalogue({ products, onAddToBasket }: ProductCatalogueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesZone = selectedZone === 'all' || product.temperatureZone === selectedZone;

      return matchesSearch && matchesCategory && matchesZone;
    });
  }, [products, searchQuery, selectedCategory, selectedZone]);

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glacier-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-glacier-300 rounded-soft text-body-sm placeholder:text-glacier-400 focus:outline-none focus:ring-2 focus:ring-valio-500 focus:border-transparent"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-glacier-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-label text-glacier-700 mb-2">
                  CATEGORY
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-glacier-300 rounded-soft text-body-sm focus:outline-none focus:ring-2 focus:ring-valio-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Temperature Zone Filter */}
              <div>
                <label className="block text-label text-glacier-700 mb-2">
                  TEMPERATURE ZONE
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-glacier-300 rounded-soft text-body-sm focus:outline-none focus:ring-2 focus:ring-valio-500 focus:border-transparent"
                >
                  <option value="all">All Zones</option>
                  <option value="ambient">🌡️ Ambient</option>
                  <option value="chilled">🧊 Chilled</option>
                  <option value="frozen">❄️ Frozen</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-glacier-600">
          {filteredProducts.length} products found
        </p>
      </div>

      {/* Product Grid/List */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
          : 'space-y-3'
      }>
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            viewMode={viewMode}
            onAddToBasket={onAddToBasket}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="!p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="text-heading text-glacier-900 mb-2">No products found</h3>
          <p className="text-body text-glacier-600">
            Try adjusting your search or filters
          </p>
        </Card>
      )}
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminInventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  Edit,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 20;

export default function InventoryList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  
  const { data: inventoryResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', currentPage, search],
    queryFn: () => adminInventoryApi.getInventory({
      skip: currentPage * PAGE_SIZE,
      limit: PAGE_SIZE,
      search: search || null,
    }),
  });

  const inventory = inventoryResponse?.items || [];
  const totalItems = inventoryResponse?.total || 0;
  const hasMore = inventoryResponse?.has_more || false;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [search]);

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    
    let filtered = inventory;
    
    // Stock filter (client-side since backend doesn't support it)
    if (stockFilter === 'low') {
      filtered = filtered.filter((item: any) => item.available_quantity < 10 && item.available_quantity > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter((item: any) => item.available_quantity === 0);
    } else if (stockFilter === 'in-stock') {
      filtered = filtered.filter((item: any) => item.available_quantity > 0);
    }
    
    return filtered;
  }, [inventory, stockFilter]);

  // Note: Stats are calculated from current page only, not all items
  // For accurate stats, we'd need a separate endpoint
  const stats = useMemo(() => {
    if (!inventory) return { total: 0, lowStock: 0, outOfStock: 0, inStock: 0 };
    
    return {
      total: totalItems,
      lowStock: inventory.filter((item: any) => item.available_quantity < 10 && item.available_quantity > 0).length,
      outOfStock: inventory.filter((item: any) => item.available_quantity === 0).length,
      inStock: inventory.filter((item: any) => item.available_quantity > 0).length,
    };
  }, [inventory, totalItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage product inventory levels</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
            <p className="text-xs text-muted-foreground">Available items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Below 10 units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            {filteredInventory.length} of {totalItems} products
            {inventoryResponse && (
              <span className="ml-2">
                (Showing {inventoryResponse.skip + 1} to {Math.min(inventoryResponse.skip + inventoryResponse.limit, totalItems)})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <LoadingSpinner className="h-32" text="Loading inventory..." />
          ) : error ? (
            <ErrorDisplay message="Failed to load inventory" onRetry={() => refetch()} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <EmptyState
                            title="No inventory items found"
                            description={search || stockFilter !== 'all' 
                              ? "Try adjusting your search or filters."
                              : "Add products to start tracking inventory."}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map((item: any) => {
                        const isLowStock = item.available_quantity < 10 && item.available_quantity > 0;
                        const isOutOfStock = item.available_quantity === 0;
                        const stockPercentage = item.quantity > 0 
                          ? (item.available_quantity / item.quantity) * 100 
                          : 0;
                        
                        return (
                          <TableRow 
                            key={item.product_code} 
                            className={`hover:bg-accent/50 transition-colors ${
                              isOutOfStock ? 'bg-red-50/50 dark:bg-red-950/10' : 
                              isLowStock ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''
                            }`}
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{item.product?.product_name || 'Unknown Product'}</span>
                                <span className="text-xs text-muted-foreground">{item.product_code}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span className={`font-semibold ${
                                  isOutOfStock ? 'text-red-600' : 
                                  isLowStock ? 'text-yellow-600' : 
                                  'text-green-600'
                                }`}>
                                  {item.available_quantity}
                                </span>
                                {item.quantity > 0 && (
                                  <div className="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        isOutOfStock ? 'bg-red-500' : 
                                        isLowStock ? 'bg-yellow-500' : 
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-muted-foreground">{item.reserved_quantity}</span>
                            </TableCell>
                            <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                            <TableCell>
                              {isOutOfStock ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Out of Stock
                                </Badge>
                              ) : isLowStock ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800 gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                                  In Stock
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(item.last_updated), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/admin/inventory/${item.product_code}`)}
                                className="gap-2"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {inventoryResponse && totalItems > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {inventoryResponse.skip + 1} to {Math.min(inventoryResponse.skip + inventoryResponse.limit, totalItems)} of {totalItems} products
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-3">
                      <span className="text-sm">
                        Page {currentPage + 1} of {Math.ceil(totalItems / PAGE_SIZE) || 1}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!hasMore}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

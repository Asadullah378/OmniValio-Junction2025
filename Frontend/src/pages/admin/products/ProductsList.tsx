import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Trash2,
  Package,
  Filter,
  Thermometer,
  Euro,
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

export default function ProductsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tempZoneFilter, setTempZoneFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ code: string; name: string } | null>(null);

  const { data: productsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-products', currentPage, search, categoryFilter, tempZoneFilter],
    queryFn: () => adminProductsApi.getProducts({
      skip: currentPage * PAGE_SIZE,
      limit: PAGE_SIZE,
      search: search || null,
      category: categoryFilter !== 'all' ? categoryFilter : null,
      temperature_zone: tempZoneFilter !== 'all' ? tempZoneFilter : null,
    }),
  });

  const products = productsResponse?.items || [];
  const totalItems = productsResponse?.total || 0;
  const hasMore = productsResponse?.has_more || false;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [search, categoryFilter, tempZoneFilter]);

  // Get unique categories from all products (we'd need a separate endpoint for this ideally)
  // For now, we'll extract from the current page
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = new Set(products.map((p: any) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const deleteMutation = useMutation({
    mutationFn: (productCode: string) => adminProductsApi.deleteProduct(productCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product deleted successfully' });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete product',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteClick = (product: any) => {
    setProductToDelete({ code: product.product_code, name: product.product_name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.code);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground mt-1">Manage product catalog and information</p>
        </div>
        <Button onClick={() => navigate('/admin/products/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Product
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Product Catalog</CardTitle>
          </div>
          <CardDescription>
            {products.length} of {totalItems} products
            {productsResponse && (
              <span className="ml-2">
                (Showing {productsResponse.skip + 1} to {Math.min(productsResponse.skip + productsResponse.limit, totalItems)})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, name, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tempZoneFilter} onValueChange={setTempZoneFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Thermometer className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Temperature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="ambient">Ambient</SelectItem>
                <SelectItem value="chilled">Chilled</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <LoadingSpinner className="h-32" text="Loading products..." />
          ) : error ? (
            <ErrorDisplay message="Failed to load products" onRetry={() => refetch()} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Temperature Zone</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <EmptyState
                            title="No products found"
                            description={search || categoryFilter !== 'all' || tempZoneFilter !== 'all'
                              ? "Try adjusting your search or filters."
                              : "Create your first product to get started."}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product: any) => (
                        <TableRow 
                          key={product.product_code} 
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.product_name}</span>
                              <span className="text-xs text-muted-foreground">{product.product_code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="outline">{product.category}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.temperature_zone ? (
                              <Badge 
                                variant="outline"
                                className={
                                  product.temperature_zone === 'frozen' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800' :
                                  product.temperature_zone === 'chilled' ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800' :
                                  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
                                }
                              >
                                {product.temperature_zone}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.price !== null && product.price !== undefined ? (
                              <div className="flex items-center justify-end gap-1">
                                <Euro className="h-3 w-3 text-muted-foreground" />
                                <span className="font-semibold">{product.price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.unit_size && product.unit_type ? (
                              <span className="text-sm text-muted-foreground">
                                {product.unit_size} {product.unit_type}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick(product)}
                              disabled={deleteMutation.isPending}
                              className="gap-2"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {productsResponse && totalItems > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {productsResponse.skip + 1} to {Math.min(productsResponse.skip + productsResponse.limit, totalItems)} of {totalItems} products
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

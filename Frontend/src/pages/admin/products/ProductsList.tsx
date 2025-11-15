import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export default function ProductsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminProductsApi.getProducts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (productCode: string) => adminProductsApi.deleteProduct(productCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete product',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Manage product catalog and information</p>
        </div>
        <Button onClick={() => navigate('/admin/products/new')}>Create Product</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>{products?.length || 0} total products</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner className="h-32" text="Loading products..." />
          ) : error ? (
            <ErrorDisplay message="Failed to load products" onRetry={() => refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Temp Zone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!products || products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        title="No products found"
                        description="Create your first product to get started."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: any) => (
                    <TableRow key={product.product_code} className="hover:bg-accent/50">
                      <TableCell className="font-medium">{product.product_code}</TableCell>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.price !== null && product.price !== undefined ? (
                          `€${product.price.toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.temperature_zone || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => navigate(`/admin/products/${product.product_code}/edit`)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${product.product_name}?`)) {
                              deleteMutation.mutate(product.product_code);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { adminInventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

export default function InventoryList() {
  const navigate = useNavigate();
  const { data: inventory, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => adminInventoryApi.getInventory(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">Monitor and manage product inventory levels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>{inventory?.length || 0} products in inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner className="h-32" text="Loading inventory..." />
          ) : error ? (
            <ErrorDisplay message="Failed to load inventory" onRetry={() => refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!inventory || inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        title="No inventory items found"
                        description="Add products to start tracking inventory."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item: any) => {
                    const isLowStock = item.available_quantity < 10;
                    return (
                      <TableRow 
                        key={item.product_code} 
                        className={`hover:bg-accent/50 ${isLowStock ? 'bg-warning/5' : ''}`}
                      >
                        <TableCell className="font-medium">{item.product_code}</TableCell>
                        <TableCell>{item.product?.product_name || '—'}</TableCell>
                        <TableCell className="text-right">
                          <span className={isLowStock ? 'text-destructive font-medium' : ''}>
                            {item.available_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{item.reserved_quantity}</TableCell>
                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(item.last_updated), 'PPP')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => navigate(`/admin/inventory/${item.product_code}`)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

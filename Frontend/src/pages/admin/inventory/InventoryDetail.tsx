import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminInventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';

export default function InventoryDetail() {
  const { productCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState('');

  const { data: item, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory-item', productCode],
    queryFn: () => adminInventoryApi.getInventoryItem(productCode!),
    enabled: !!productCode,
  });

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity.toString());
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: (newQuantity: number) => adminInventoryApi.updateInventory(productCode!, newQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', productCode] });
      toast({ title: 'Inventory updated successfully' });
      navigate('/admin/inventory');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update inventory',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      toast({ 
        title: 'Invalid quantity', 
        description: 'Please enter a valid positive number',
        variant: 'destructive' 
      });
      return;
    }
    updateMutation.mutate(qty);
  };

  if (isLoading) {
    return <LoadingSpinner className="h-64" text="Loading inventory item..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : 'Failed to load inventory item'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!item) {
    return <ErrorDisplay message="Inventory item not found" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/inventory')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Inventory: {item.product_code}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Product Code</p>
              <p className="font-medium">{item.product_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product Name</p>
              <p className="font-medium">{item.product?.product_name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Quantity</p>
              <p className="font-medium">{item.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="font-medium">{item.available_quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reserved</p>
              <p className="font-medium">{item.reserved_quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{new Date(item.last_updated).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Quantity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">New Total Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={item.quantity.toString()}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will update the total quantity. Available quantity will be calculated automatically.
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Inventory'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/inventory')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

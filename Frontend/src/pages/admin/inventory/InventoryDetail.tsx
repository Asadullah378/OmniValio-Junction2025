import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminInventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Save,
  X
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function InventoryDetail() {
  const { productCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: item, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory-item', productCode],
    queryFn: () => adminInventoryApi.getInventoryItem(productCode!),
    enabled: !!productCode,
  });

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity.toString());
      setHasChanges(false);
    }
  }, [item]);

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    setHasChanges(value !== item?.quantity.toString());
  };

  const updateMutation = useMutation({
    mutationFn: (newQuantity: number) => adminInventoryApi.updateInventory(productCode!, newQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', productCode] });
      toast({ 
        title: 'Inventory updated successfully',
        description: `Quantity updated to ${quantity} units`
      });
      setHasChanges(false);
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

  const isLowStock = item.available_quantity < 10 && item.available_quantity > 0;
  const isOutOfStock = item.available_quantity === 0;
  const stockPercentage = item.quantity > 0 
    ? (item.available_quantity / item.quantity) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/inventory')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Inventory</h1>
          <p className="text-muted-foreground mt-1">{item.product?.product_name || item.product_code}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Product Code</p>
                <p className="font-semibold">{item.product_code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                <p className="font-semibold">{item.product?.product_name || '—'}</p>
              </div>
            </div>
            
            {item.product && (
              <div className="pt-4 border-t space-y-2">
                {item.product.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <Badge variant="outline">{item.product.category}</Badge>
                  </div>
                )}
                {item.product.temperature_zone && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Temperature Zone:</span>
                    <Badge variant="outline">{item.product.temperature_zone}</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Available Quantity</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${
                    isOutOfStock ? 'text-red-600' : 
                    isLowStock ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {item.available_quantity}
                  </span>
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
                </div>
              </div>
              
              {item.quantity > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Stock Level</span>
                    <span>{stockPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        isOutOfStock ? 'bg-red-500' : 
                        isLowStock ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-lg font-semibold">{item.reserved_quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-lg font-semibold">{item.quantity}</p>
                </div>
              </div>
              
              <div className="pt-2 border-t flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Last updated: {format(new Date(item.last_updated), 'PPP p')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Quantity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Update Quantity</CardTitle>
          <CardDescription>
            Update the total quantity for this product. Available quantity will be calculated automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">New Total Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder={item.quantity.toString()}
                required
                className="text-lg font-semibold"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Current: {item.quantity}</span>
                {hasChanges && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">
                      New: {quantity || item.quantity}
                    </span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
                      Available: {parseInt(quantity || '0') - item.reserved_quantity}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={updateMutation.isPending || !hasChanges}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Updating...' : 'Update Inventory'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setQuantity(item.quantity.toString());
                  setHasChanges(false);
                }}
                disabled={!hasChanges || updateMutation.isPending}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Reset
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate('/admin/inventory')}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

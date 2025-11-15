import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';

export default function ProductForm() {
  const { productCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!productCode;

  const [formData, setFormData] = useState({
    product_code: '',
    product_name: '',
    category: '',
    sub_category: '',
    temperature_zone: 'ambient',
    shelf_life_days: '',
    unit_size: '',
    unit_type: 'kg',
    price: '',
  });

  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-product', productCode],
    queryFn: () => adminProductsApi.getProduct(productCode!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        product_code: product.product_code || '',
        product_name: product.product_name || '',
        category: product.category || '',
        sub_category: product.sub_category || '',
        temperature_zone: product.temperature_zone || 'ambient',
        shelf_life_days: product.shelf_life_days?.toString() || '',
        unit_size: product.unit_size?.toString() || '',
        unit_type: product.unit_type || 'kg',
        price: product.price?.toString() || '',
      });
    }
  }, [product]);

  const createMutation = useMutation({
    mutationFn: (data: any) => adminProductsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product created successfully' });
      navigate('/admin/products');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create product',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminProductsApi.updateProduct(productCode!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', productCode] });
      toast({ title: 'Product updated successfully' });
      navigate('/admin/products');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update product',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_name.trim()) {
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      return;
    }

    const payload: any = {
      product_name: formData.product_name,
      category: formData.category || null,
      sub_category: formData.sub_category || null,
      temperature_zone: formData.temperature_zone || null,
      shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
      unit_size: formData.unit_size ? parseFloat(formData.unit_size) : null,
      unit_type: formData.unit_type || null,
      price: formData.price ? parseFloat(formData.price) : null,
    };

    if (!isEditing) {
      if (!formData.product_code.trim()) {
        toast({
          title: 'Error',
          description: 'Product code is required',
          variant: 'destructive',
        });
        return;
      }
      payload.product_code = formData.product_code;
    }

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditing && isLoading) {
    return <LoadingSpinner className="h-64" text="Loading product..." />;
  }

  if (isEditing && error) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : 'Failed to load product'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Product' : 'Create Product'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product_code">Product Code {!isEditing && '*'}</Label>
                <Input
                  id="product_code"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  disabled={isEditing}
                  required={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub_category">Sub Category</Label>
                <Input
                  id="sub_category"
                  value={formData.sub_category}
                  onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature_zone">Temperature Zone</Label>
                <Select
                  value={formData.temperature_zone}
                  onValueChange={(value) => setFormData({ ...formData, temperature_zone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambient">Ambient</SelectItem>
                    <SelectItem value="chilled">Chilled</SelectItem>
                    <SelectItem value="frozen">Frozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shelf_life_days">Shelf Life (days)</Label>
                <Input
                  id="shelf_life_days"
                  type="number"
                  min="0"
                  value={formData.shelf_life_days}
                  onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_size">Unit Size</Label>
                <Input
                  id="unit_size"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_size}
                  onChange={(e) => setFormData({ ...formData, unit_size: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_type">Unit Type</Label>
                <Select
                  value={formData.unit_type}
                  onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="l">L</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="box">box</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing 
                  ? (updateMutation.isPending ? 'Updating...' : 'Update Product')
                  : (createMutation.isPending ? 'Creating...' : 'Create Product')
                }
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

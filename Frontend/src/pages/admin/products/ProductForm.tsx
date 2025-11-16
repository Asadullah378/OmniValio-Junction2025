import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Separator } from '@/components/ui/separator';

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

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required';
    }
    
    if (!isEditing && !formData.product_code.trim()) {
      newErrors.product_code = 'Product code is required';
    }
    
    if (formData.price && (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0)) {
      newErrors.price = 'Price must be a valid positive number';
    }
    
    if (formData.shelf_life_days && (isNaN(parseInt(formData.shelf_life_days)) || parseInt(formData.shelf_life_days) < 0)) {
      newErrors.shelf_life_days = 'Shelf life must be a valid positive number';
    }
    
    if (formData.unit_size && (isNaN(parseFloat(formData.unit_size)) || parseFloat(formData.unit_size) < 0)) {
      newErrors.unit_size = 'Unit size must be a valid positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => adminProductsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ 
        title: 'Product created successfully',
        description: `${formData.product_name} has been added to the catalog.`
      });
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
      toast({ 
        title: 'Product updated successfully',
        description: `${formData.product_name} has been updated.`
      });
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
    
    if (!validateForm()) {
      return;
    }

    const payload: any = {
      product_name: formData.product_name.trim(),
      category: formData.category.trim() || null,
      sub_category: formData.sub_category.trim() || null,
      temperature_zone: formData.temperature_zone || null,
      shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
      unit_size: formData.unit_size ? parseFloat(formData.unit_size) : null,
      unit_type: formData.unit_type || null,
      price: formData.price ? parseFloat(formData.price) : null,
    };

    if (!isEditing) {
      payload.product_code = formData.product_code.trim();
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? 'Update product information' : 'Add a new product to the catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Essential product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="product_code">
                    Product Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="product_code"
                    value={formData.product_code}
                    onChange={(e) => {
                      setFormData({ ...formData, product_code: e.target.value });
                      if (errors.product_code) setErrors({ ...errors, product_code: '' });
                    }}
                    placeholder="e.g., PROD-001"
                    className={errors.product_code ? 'border-destructive' : ''}
                    required
                  />
                  {errors.product_code && (
                    <p className="text-xs text-destructive">{errors.product_code}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="product_name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => {
                    setFormData({ ...formData, product_name: e.target.value });
                    if (errors.product_name) setErrors({ ...errors, product_name: '' });
                  }}
                  placeholder="Enter product name"
                  className={errors.product_name ? 'border-destructive' : ''}
                  required
                />
                {errors.product_name && (
                  <p className="text-xs text-destructive">{errors.product_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Dairy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub_category">Sub Category</Label>
                  <Input
                    id="sub_category"
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    placeholder="e.g., Cheese"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Additional product specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  onChange={(e) => {
                    setFormData({ ...formData, shelf_life_days: e.target.value });
                    if (errors.shelf_life_days) setErrors({ ...errors, shelf_life_days: '' });
                  }}
                  placeholder="e.g., 7"
                  className={errors.shelf_life_days ? 'border-destructive' : ''}
                />
                {errors.shelf_life_days && (
                  <p className="text-xs text-destructive">{errors.shelf_life_days}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_size">Unit Size</Label>
                  <Input
                    id="unit_size"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_size}
                    onChange={(e) => {
                      setFormData({ ...formData, unit_size: e.target.value });
                      if (errors.unit_size) setErrors({ ...errors, unit_size: '' });
                    }}
                    placeholder="e.g., 1.5"
                    className={errors.unit_size ? 'border-destructive' : ''}
                  />
                  {errors.unit_size && (
                    <p className="text-xs text-destructive">{errors.unit_size}</p>
                  )}
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
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="price">Price (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({ ...formData, price: e.target.value });
                    if (errors.price) setErrors({ ...errors, price: '' });
                  }}
                  placeholder="e.g., 9.99"
                  className={errors.price ? 'border-destructive' : ''}
                />
                {errors.price && (
                  <p className="text-xs text-destructive">{errors.price}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isEditing 
              ? (updateMutation.isPending ? 'Updating...' : 'Update Product')
              : (createMutation.isPending ? 'Creating...' : 'Create Product')
            }
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/admin/products')}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

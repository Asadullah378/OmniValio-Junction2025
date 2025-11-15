import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerProductsApi, customerCartApi, customerOrdersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Sparkles,
  Wand2,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, addDays, isSameDay, parseISO } from 'date-fns';

// Risk category helper
function getRiskCategory(riskScore: number | null | undefined): { 
  label: string; 
  bgColor: string; 
  textColor: string; 
  borderColor: string;
} {
  if (riskScore === null || riskScore === undefined) {
    return { 
      label: 'Unknown', 
      bgColor: 'bg-muted', 
      textColor: 'text-muted-foreground',
      borderColor: 'border-muted-foreground/20'
    };
  }
  const percentage = riskScore * 100;
  if (percentage < 20) {
    return { 
      label: 'Safe', 
      bgColor: 'bg-green-500', 
      textColor: 'text-white',
      borderColor: 'border-green-600'
    };
  } else if (percentage < 40) {
    return { 
      label: 'Low', 
      bgColor: 'bg-yellow-500', 
      textColor: 'text-white',
      borderColor: 'border-yellow-600'
    };
  } else if (percentage < 60) {
    return { 
      label: 'Medium', 
      bgColor: 'bg-orange-500', 
      textColor: 'text-white',
      borderColor: 'border-orange-600'
    };
  } else if (percentage < 80) {
    return { 
      label: 'High', 
      bgColor: 'bg-red-500', 
      textColor: 'text-white',
      borderColor: 'border-red-600'
    };
  } else {
    return { 
      label: 'Very High', 
      bgColor: 'bg-red-700', 
      textColor: 'text-white',
      borderColor: 'border-red-800'
    };
  }
}

export default function NewOrder() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedProductForSimilar, setSelectedProductForSimilar] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [similarDialogOpen, setSimilarDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryStart, setDeliveryStart] = useState('');
  const [deliveryEnd, setDeliveryEnd] = useState('');
  const [substituteDialogOpen, setSubstituteDialogOpen] = useState(false);
  const [editingCartItemId, setEditingCartItemId] = useState<number | null>(null);
  const [productRisks, setProductRisks] = useState<Record<string, number | null>>({});
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get minimum delivery date (tomorrow)
  const minDeliveryDate = useMemo(() => {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  }, []);

  const { data: products } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => customerProductsApi.getProducts({ search, category: category === 'all' ? undefined : category, limit: 50 }),
  });

  const { data: cart, refetch: refetchCart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => customerCartApi.getCart(),
  });

  // Load risk scores for all products
  useEffect(() => {
    if (products) {
      const loadRisks = async () => {
        const riskPromises = products.map(async (product: any) => {
          try {
            const risk = await customerProductsApi.getProductRisk(product.product_code);
            // Risk API might return risk_score directly or in a nested structure
            const riskScore = risk.risk_score ?? risk?.risk_score ?? null;
            return { productCode: product.product_code, riskScore };
          } catch (error) {
            return { productCode: product.product_code, riskScore: null };
          }
        });
        
        const results = await Promise.all(riskPromises);
        const riskMap: Record<string, number | null> = {};
        results.forEach(({ productCode, riskScore }) => {
          riskMap[productCode] = riskScore;
        });
        setProductRisks(riskMap);
      };
      
      loadRisks();
    }
  }, [products]);

  const addToCartMutation = useMutation({
    mutationFn: (item: any) => customerCartApi.addToCart(item),
    onSuccess: () => {
      refetchCart();
      toast({ 
        title: 'Added to cart',
        description: 'Product added successfully'
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (id: number) => customerCartApi.removeFromCart(id),
    onSuccess: () => {
      refetchCart();
      toast({ title: 'Removed from cart' });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, newQuantity }: { cartItemId: number; newQuantity: number }) => {
      return customerCartApi.updateQuantity(cartItemId, newQuantity);
    },
    onSuccess: () => {
      refetchCart();
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: (data: any) => customerOrdersApi.placeOrder(data),
    onSuccess: (data) => {
      toast({ 
        title: 'Order placed successfully!',
        description: 'Your order has been submitted'
      });
      customerCartApi.clearCart();
      navigate(`/customer/orders/${data.order_id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to place order',
        variant: 'destructive',
      });
    },
  });

  const loadSimilar = async (productCode: string) => {
    try {
      const similar = await customerProductsApi.getSimilarProducts(productCode);
      setSimilarProducts(similar);
    } catch (error) {
      console.error('Failed to load similar products', error);
      setSimilarProducts([]);
    }
  };

  const handleAddToCart = (product: any) => {
    // Check if product is already in cart
    const existingItem = cart?.items.find((item) => item.product_code === product.product_code);
    
    if (existingItem) {
      // Increase quantity using the update endpoint
      updateQuantityMutation.mutate({ 
        cartItemId: existingItem.cart_item_id, 
        newQuantity: existingItem.quantity + 1 
      });
      toast({ 
        title: 'Quantity increased',
        description: `${product.product_name} quantity updated`
      });
    } else {
      // Add new item
      addToCartMutation.mutate({
        product_code: product.product_code,
        quantity: 1,
        substitutes: [],
      });
    }
  };

  const handlePlaceOrder = () => {
    // Validation
    if (!deliveryDate) {
      toast({ 
        title: 'Delivery date required', 
        description: 'Please select a delivery date',
        variant: 'destructive' 
      });
      return;
    }

    // Check if delivery date is today
    const selectedDate = parseISO(deliveryDate);
    if (isSameDay(selectedDate, new Date())) {
      toast({ 
        title: 'Invalid delivery date', 
        description: 'Delivery date cannot be the same day as order placement',
        variant: 'destructive' 
      });
      return;
    }

    // Check time window
    if (deliveryStart && deliveryEnd) {
      if (deliveryStart >= deliveryEnd) {
        toast({ 
          title: 'Invalid time window', 
          description: 'Start time must be before end time',
          variant: 'destructive' 
        });
        return;
      }
    }

    if (!cart || cart.items.length === 0) {
      toast({ 
        title: 'Cart is empty', 
        variant: 'destructive' 
      });
      return;
    }

    placeOrderMutation.mutate({
      delivery_date: deliveryDate,
      delivery_window_start: deliveryStart || undefined,
      delivery_window_end: deliveryEnd || undefined,
    });
  };

  const openSubstituteDialog = (cartItemId: number) => {
    setEditingCartItemId(cartItemId);
    setSubstituteDialogOpen(true);
  };

  const openSimilarDialog = (product: any) => {
    setSelectedProductForSimilar(product);
    setSimilarDialogOpen(true);
    loadSimilar(product.product_code);
  };

  const addSubstitute = async (substituteCode: string, priority: number) => {
    const cartItem = cart?.items.find((item) => item.cart_item_id === editingCartItemId);
    if (!cartItem) return;

    const existingSubs = cartItem.substitutes || [];
    if (existingSubs.some((sub: any) => sub.priority === priority)) {
      toast({ 
        title: `Priority ${priority} already assigned`, 
        variant: 'destructive' 
      });
      return;
    }
    if (existingSubs.length >= 2) {
      toast({ 
        title: 'Maximum 2 substitutes allowed', 
        variant: 'destructive' 
      });
      return;
    }

    await removeFromCartMutation.mutateAsync(editingCartItemId);
    await addToCartMutation.mutateAsync({
      product_code: cartItem.product_code,
      quantity: cartItem.quantity,
      substitutes: [...existingSubs, { substitute_product_code: substituteCode, priority }],
    });

    toast({ 
      title: `Substitute ${priority} added`,
      description: 'AI-powered substitution configured'
    });
  };

  const removeSubstitute = async (priority: number) => {
    const cartItem = cart?.items.find((item) => item.cart_item_id === editingCartItemId);
    if (!cartItem) return;

    const existingSubs = cartItem.substitutes || [];
    const updatedSubs = existingSubs.filter((sub: any) => sub.priority !== priority);

    await removeFromCartMutation.mutateAsync(editingCartItemId);
    await addToCartMutation.mutateAsync({
      product_code: cartItem.product_code,
      quantity: cartItem.quantity,
      substitutes: updatedSubs,
    });

    toast({ title: `Substitute ${priority} removed` });
  };

  const handleAddSimilarToCart = (product: any, replace: boolean = false) => {
    if (replace && selectedProductForSimilar) {
      // Replace the original product in cart
      const existingItem = cart?.items.find((item) => item.product_code === selectedProductForSimilar.product_code);
      if (existingItem) {
        removeFromCartMutation.mutate(existingItem.cart_item_id);
      }
    }
    handleAddToCart(product);
    if (!replace) {
      setSimilarDialogOpen(false);
    }
  };

  const cartTotal = cart?.items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0) || 0;

  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Product Browser */}
      <div className="col-span-2 space-y-4 overflow-y-auto">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="dairy">Dairy</SelectItem>
              <SelectItem value="meat">Meat</SelectItem>
              <SelectItem value="produce">Produce</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {products?.map((product: any) => {
            const riskScore = productRisks[product.product_code] ?? product.risk_score;
            const riskCategory = getRiskCategory(riskScore);
            const isInCart = cart?.items.some((item) => item.product_code === product.product_code);
            
            return (
              <Card key={product.product_code} className="hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                {/* AI Risk Badge - Always Visible */}
                <div className="absolute top-2 right-2 z-10">
                  <Badge 
                    variant="outline"
                    className={`${riskCategory.bgColor} ${riskCategory.borderColor} border-2 flex items-center gap-1 animate-pulse shadow-sm`}
                    style={{ color: riskCategory.textColor === 'text-white' ? 'white' : undefined }}
                  >
                    <Sparkles className="h-3 w-3" style={{ color: riskCategory.textColor === 'text-white' ? 'white' : undefined }} />
                    <span className="font-semibold" style={{ color: riskCategory.textColor === 'text-white' ? 'white' : undefined }}>{riskCategory.label}</span>
                  </Badge>
                </div>

                <CardHeader>
                  <div className="flex justify-between items-start pr-20">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.product_name}</CardTitle>
                      {product.category && (
                        <Badge variant="outline" className="mt-1">{product.category}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">€{product.price?.toFixed(2) || '0.00'}</span>
                    {product.unit_size && product.unit_type && (
                      <span className="text-sm text-muted-foreground">
                        {product.unit_size} {product.unit_type}
                      </span>
                    )}
                  </div>
                  
                  {/* AI Risk Score Display */}
                  {riskScore !== null && riskScore !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="h-3 w-3 text-purple-500" />
                      <span className="text-muted-foreground">AI Risk Score:</span>
                      <span className="font-medium">{(riskScore * 100).toFixed(0)}%</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAddToCart(product)} 
                      size="sm" 
                      className="flex-1"
                      variant={isInCart ? 'secondary' : 'default'}
                    >
                      {isInCart ? (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add More
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Dialog 
                      open={similarDialogOpen && selectedProductForSimilar?.product_code === product.product_code} 
                      onOpenChange={(open) => {
                        setSimilarDialogOpen(open);
                        if (!open) setSelectedProductForSimilar(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSimilarDialog(product)}
                          className="relative"
                        >
                          <Wand2 className="h-4 w-4" />
                          <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-ping" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                            AI-Powered Similar Products
                            <Badge variant="outline" className="ml-2 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Powered by AI
                            </Badge>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Discover similar products powered by AI recommendations for <strong>{product.product_name}</strong>
                          </p>
                          {similarProducts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                              {similarProducts.map((similar: any) => {
                                const similarRiskScore = productRisks[similar.product_code] ?? similar.risk_score;
                                const similarRisk = getRiskCategory(similarRiskScore);
                                return (
                                  <Card key={similar.product_code} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 space-y-3">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <h4 className="font-medium">{similar.product_name}</h4>
                                          {similar.category && (
                                            <Badge variant="outline" className="mt-1 text-xs">
                                              {similar.category}
                                            </Badge>
                                          )}
                                        </div>
                                        <Badge 
                                          variant="outline"
                                          className={`${similarRisk.bgColor} ${similarRisk.borderColor} border`}
                                          style={{ color: 'white' }}
                                        >
                                          {similarRisk.label}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold">€{similar.price?.toFixed(2) || '0.00'}</span>
                                        {similar.unit_size && similar.unit_type && (
                                          <span className="text-xs text-muted-foreground">
                                            {similar.unit_size} {similar.unit_type}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1"
                                          onClick={() => handleAddSimilarToCart(similar, false)}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="flex-1"
                                          onClick={() => handleAddSimilarToCart(similar, true)}
                                        >
                                          <Zap className="h-3 w-3 mr-1" />
                                          Replace
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Wand2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No similar products found</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart ({cart?.items.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart?.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Your cart is empty</p>
                <p className="text-xs mt-1">Add products to get started</p>
              </div>
            ) : (
              cart?.items.map((item) => {
                const itemRisk = getRiskCategory(item.risk_score);
                return (
                  <div key={item.cart_item_id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.product_name}</p>
                        {item.risk_score !== null && item.risk_score !== undefined && (
                          <Badge 
                            variant="outline"
                            className={`${itemRisk.bgColor} ${itemRisk.borderColor} border text-xs mt-1`}
                            style={{ color: 'white' }}
                          >
                            <Sparkles className="h-2 w-2 mr-1" style={{ color: 'white' }} />
                            <span>{itemRisk.label}</span>
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCartMutation.mutate(item.cart_item_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantityMutation.mutate({ 
                            cartItemId: item.cart_item_id, 
                            newQuantity: Math.max(1, item.quantity - 1) 
                          })}
                          disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantityMutation.mutate({ 
                            cartItemId: item.cart_item_id, 
                            newQuantity: item.quantity + 1 
                          })}
                          disabled={updateQuantityMutation.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold">€{((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => openSubstituteDialog(item.cart_item_id)}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        AI Substitutes ({item.substitutes?.length || 0}/2)
                      </Button>
                      {item.substitutes && item.substitutes.length > 0 && (
                        <div className="space-y-1">
                          {item.substitutes.map((sub: any) => {
                            const subProduct = products?.find((p: any) => p.product_code === sub.substitute_product_code);
                            return (
                              <div key={sub.priority} className="text-xs bg-purple-50 dark:bg-purple-950/20 p-2 rounded border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-1 mb-1">
                                  <Sparkles className="h-2 w-2 text-purple-500" />
                                  <span className="font-medium">Priority {sub.priority}:</span>
                                </div>
                                <span>{subProduct?.product_name || 'Product'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {cart && cart.items.length > 0 && (
              <>
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Delivery Date *
                    </label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={minDeliveryDate}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Delivery cannot be on the same day as order placement
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Window Start
                      </label>
                      <Input
                        type="time"
                        value={deliveryStart}
                        onChange={(e) => setDeliveryStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Window End
                      </label>
                      <Input
                        type="time"
                        value={deliveryEnd}
                        onChange={(e) => setDeliveryEnd(e.target.value)}
                        min={deliveryStart || undefined}
                      />
                    </div>
                  </div>
                  {deliveryStart && deliveryEnd && deliveryStart >= deliveryEnd && (
                    <p className="text-xs text-destructive">
                      Start time must be before end time
                    </p>
                  )}
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={placeOrderMutation.isPending || !deliveryDate}
                    className="w-full"
                    size="lg"
                  >
                    {placeOrderMutation.isPending ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Substitute Dialog */}
      <Dialog open={substituteDialogOpen} onOpenChange={setSubstituteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              AI-Powered Substitutes
              <Badge variant="outline" className="ml-2">Max 2</Badge>
            </DialogTitle>
          </DialogHeader>
          
          {editingCartItemId && (() => {
            const cartItem = cart?.items.find((item) => item.cart_item_id === editingCartItemId);
            const existingSubs = cartItem?.substitutes || [];
            
            return (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <strong>AI Substitution:</strong> If the selected product is unavailable, our AI will automatically use these substitutes in priority order.
                  </p>
                </div>

                {/* Current Substitutes */}
                {existingSubs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Current Substitutes</h3>
                    {existingSubs.map((sub: any) => {
                      const subProduct = products?.find((p: any) => p.product_code === sub.substitute_product_code);
                      return (
                        <div key={sub.priority} className="flex justify-between items-center p-3 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Priority {sub.priority}</Badge>
                              <Sparkles className="h-3 w-3 text-purple-500" />
                            </div>
                            <p className="font-medium mt-1">{subProduct?.product_name || 'Product'}</p>
                            {subProduct?.price && (
                              <p className="text-sm text-muted-foreground">€{subProduct.price.toFixed(2)}</p>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSubstitute(sub.priority)}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Available Products */}
                {existingSubs.length < 2 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Select Substitute Product</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {products?.filter((p: any) => 
                        p.product_code !== cartItem?.product_code &&
                        !existingSubs.some((sub: any) => sub.substitute_product_code === p.product_code)
                      ).slice(0, 20).map((product: any) => {
                        const productRisk = getRiskCategory(productRisks[product.product_code]);
                        return (
                          <div key={product.product_code} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted transition-colors">
                            <div className="flex-1">
                              <p className="font-medium">{product.product_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold">€{product.price?.toFixed(2) || '0.00'}</span>
                                <Badge 
                                  variant="outline"
                                  className={`${productRisk.bgColor} ${productRisk.borderColor} border`}
                                  style={{ color: 'white' }}
                                >
                                  {productRisk.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!existingSubs.some((sub: any) => sub.priority === 1) && (
                                <Button size="sm" onClick={() => addSubstitute(product.product_code, 1)}>
                                  Priority 1
                                </Button>
                              )}
                              {!existingSubs.some((sub: any) => sub.priority === 2) && (
                                <Button size="sm" variant="outline" onClick={() => addSubstitute(product.product_code, 2)}>
                                  Priority 2
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

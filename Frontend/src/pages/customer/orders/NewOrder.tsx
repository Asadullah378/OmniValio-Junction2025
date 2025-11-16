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
  Sparkle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { PaginatedResponse, Category } from '@/lib/types';

// Shortage risk category helper
function getShortageRiskCategory(riskScore: number | null | undefined): { 
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
  if (percentage < 10) {
    return { 
      label: 'Safe', 
      bgColor: 'bg-green-500', 
      textColor: 'text-white',
      borderColor: 'border-green-600'
    };
  } else if (percentage < 25) {
    return { 
      label: 'Low', 
      bgColor: 'bg-yellow-500', 
      textColor: 'text-white',
      borderColor: 'border-yellow-600'
    };
  } else if (percentage < 40) {
    return { 
      label: 'Medium', 
      bgColor: 'bg-orange-500', 
      textColor: 'text-white',
      borderColor: 'border-orange-600'
    };
  } else if (percentage < 55) {
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
  const [category, setCategory] = useState<string>('all');
  const [subCategory, setSubCategory] = useState<string>('all');
  const [temperatureZone, setTemperatureZone] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [selectedProductForSimilar, setSelectedProductForSimilar] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [similarDialogOpen, setSimilarDialogOpen] = useState(false);
  const [substituteRecommendations, setSubstituteRecommendations] = useState<any[]>([]);
  const [loadingSubstitutes, setLoadingSubstitutes] = useState(false);
  // Get default delivery date (tomorrow)
  const defaultDeliveryDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate);
  const [deliveryStart, setDeliveryStart] = useState('09:00');
  const [deliveryEnd, setDeliveryEnd] = useState('12:00');
  const [substituteDialogOpen, setSubstituteDialogOpen] = useState(false);
  const [editingCartItemId, setEditingCartItemId] = useState<number | null>(null);
  const [shortageRisks, setShortageRisks] = useState<Record<string, number | null>>({});
  const [assessingRiskFor, setAssessingRiskFor] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get minimum delivery date (tomorrow)
  const minDeliveryDate = useMemo(() => {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  }, []);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['product-categories'],
    queryFn: () => customerProductsApi.getCategories(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Debug: Log categories
  useEffect(() => {
    if (categories) {
      console.log('Categories loaded:', categories);
    }
    if (categoriesError) {
      console.error('Categories error:', categoriesError);
    }
  }, [categories, categoriesError]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [search, category, subCategory, temperatureZone]);

  // Get subcategories for selected category
  const availableSubCategories = useMemo(() => {
    if (category === 'all' || !categories) return [];
    const selectedCategory = categories.find((cat: Category) => cat.category === category);
    return selectedCategory?.sub_categories || [];
  }, [category, categories]);

  const { data: productsResponse, isLoading: productsLoading, error: productsError } = useQuery<PaginatedResponse<any>>({
    queryKey: ['products', search, category, subCategory, temperatureZone, currentPage],
    queryFn: () => customerProductsApi.getProducts({ 
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      sub_category: subCategory === 'all' ? undefined : subCategory,
      temperature_zone: temperatureZone === 'all' ? undefined : temperatureZone,
      skip: currentPage * pageSize,
      limit: pageSize,
    }),
  });

  const products = productsResponse?.items || [];

  // Debug: Log products and prices
  useEffect(() => {
    if (productsResponse?.items) {
      console.log('Products loaded:', productsResponse.items.length);
      productsResponse.items.forEach((product: any) => {
        if (product.price === null || product.price === undefined) {
          console.warn('Product missing price:', product.product_code, product.product_name, product);
        }
      });
    }
    if (productsError) {
      console.error('Products error:', productsError);
    }
  }, [productsResponse, productsError]);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => customerCartApi.getCart(),
    staleTime: Infinity, // Never refetch automatically
  });
  
  const queryClient = useQueryClient();

  // Function to assess shortage risk for cart items and substitutes
  const assessShortageRisk = async (itemsToAssess: Array<{
    product_code: string;
    quantity: number;
  }>) => {
    if (itemsToAssess.length === 0) return;
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const riskRequests = itemsToAssess.map(item => ({
        product_code: item.product_code,
        order_qty: item.quantity,
        order_created_date: today,
        requested_delivery_date: deliveryDate,
      }));
      
      const response = await customerProductsApi.assessProductsRisk(riskRequests);
      const riskMap: Record<string, number | null> = {};
      
      if (response.predictions && Array.isArray(response.predictions)) {
        response.predictions.forEach((prediction: any) => {
          riskMap[prediction.product_code] = prediction.shortage_probability ?? null;
        });
      }
      
      setShortageRisks(prev => ({ ...prev, ...riskMap }));
    } catch (error) {
      console.error('Failed to assess shortage risk:', error);
      // Set null for all items that failed
      const riskMap: Record<string, number | null> = {};
      itemsToAssess.forEach(item => {
        riskMap[item.product_code] = null;
      });
      setShortageRisks(prev => ({ ...prev, ...riskMap }));
    }
  };

  // Assess shortage risk for all cart items when delivery date changes
  useEffect(() => {
    if (cart?.items && cart.items.length > 0 && deliveryDate) {
      const assess = async () => {
        const productCodes = cart.items.map((item: any) => item.product_code);
        setAssessingRiskFor(prev => new Set([...prev, ...productCodes]));
        
        try {
          const today = format(new Date(), 'yyyy-MM-dd');
          const riskRequests = cart.items.map((item: any) => ({
            product_code: item.product_code,
            order_qty: item.quantity,
            order_created_date: today,
            requested_delivery_date: deliveryDate,
          }));
          
          const response = await customerProductsApi.assessProductsRisk(riskRequests);
          const riskMap: Record<string, number | null> = {};
          
          if (response.predictions && Array.isArray(response.predictions)) {
            response.predictions.forEach((prediction: any) => {
              riskMap[prediction.product_code] = prediction.shortage_probability ?? null;
            });
          }
          
          setShortageRisks(prev => ({ ...prev, ...riskMap }));
        } catch (error) {
          console.error('Failed to assess shortage risk:', error);
        } finally {
          setAssessingRiskFor(prev => {
            const newSet = new Set(prev);
            productCodes.forEach(code => newSet.delete(code));
            return newSet;
          });
        }
      };
      
      assess();
    }
  }, [deliveryDate]); // Only trigger on delivery date change

  // Assess shortage risk for newly added cart items
  useEffect(() => {
    if (cart?.items && cart.items.length > 0 && deliveryDate) {
      // Only assess for newly added items (those not in shortageRisks yet)
      const itemsToAssess = cart.items.filter((item: any) => 
        !(item.product_code in shortageRisks)
      );
      
      if (itemsToAssess.length > 0) {
        const assess = async () => {
          const productCodes = itemsToAssess.map((item: any) => item.product_code);
          setAssessingRiskFor(prev => new Set([...prev, ...productCodes]));
          
          try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const riskRequests = itemsToAssess.map((item: any) => ({
              product_code: item.product_code,
              order_qty: item.quantity,
              order_created_date: today,
              requested_delivery_date: deliveryDate,
            }));
            
            const response = await customerProductsApi.assessProductsRisk(riskRequests);
            const riskMap: Record<string, number | null> = {};
            
            if (response.predictions && Array.isArray(response.predictions)) {
              response.predictions.forEach((prediction: any) => {
                riskMap[prediction.product_code] = prediction.shortage_probability ?? null;
              });
            }
            
            setShortageRisks(prev => ({ ...prev, ...riskMap }));
          } catch (error) {
            console.error('Failed to assess shortage risk for new items:', error);
          } finally {
            setAssessingRiskFor(prev => {
              const newSet = new Set(prev);
              productCodes.forEach(code => newSet.delete(code));
              return newSet;
            });
          }
        };
        
        assess();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.items?.length, deliveryDate]); // Trigger when number of items changes or delivery date changes

  // Store substitute product details when cart is updated
  const [substituteProducts, setSubstituteProducts] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (cart?.items) {
      const loadSubstituteProducts = async () => {
        const productCodes = new Set<string>();
        
        // Collect all substitute product codes
        cart.items.forEach((item) => {
          item.substitutes?.forEach((sub: any) => {
            productCodes.add(sub.substitute_product_code);
          });
        });
        
        // Fetch product details for substitutes that we don't have
        const missingProducts = Array.from(productCodes).filter(
          (code) => !substituteProducts[code] && 
          !products?.find((p: any) => p.product_code === code) &&
          !substituteRecommendations.find((p: any) => p.product_code === code) &&
          !similarProducts.find((p: any) => p.product_code === code)
        );
        
        if (missingProducts.length > 0) {
          const productPromises = missingProducts.map(async (code) => {
            try {
              const product = await customerProductsApi.getProduct(code);
              return { code, product };
            } catch (error) {
              return { code, product: null };
            }
          });
          
          const results = await Promise.all(productPromises);
          const newProducts: Record<string, any> = {};
          results.forEach(({ code, product }) => {
            if (product) {
              newProducts[code] = product;
            }
          });
          
          if (Object.keys(newProducts).length > 0) {
            setSubstituteProducts(prev => ({ ...prev, ...newProducts }));
          }
        }
      };
      
      loadSubstituteProducts();
    }
  }, [cart, products, substituteRecommendations, similarProducts]);

  const addToCartMutation = useMutation({
    mutationFn: (item: any) => customerCartApi.addToCart(item),
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart']);
      
      // Optimistically update the cart
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) {
          // Initialize cart if it doesn't exist
          return {
            cart_id: 0,
            customer_id: '',
            items: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        
        // Ensure items is always an array
        const items = old.items || [];
        
        // Check if product already exists in cart
        const existingItem = items.find((i: any) => i.product_code === newItem.product_code);
        
        if (existingItem) {
          // Update quantity and/or substitutes if product exists
          return {
            ...old,
            items: items.map((i: any) =>
              i.cart_item_id === existingItem.cart_item_id
                ? { 
                    ...i, 
                    quantity: newItem.quantity !== undefined ? newItem.quantity : i.quantity + (newItem.quantity || 1),
                    substitutes: newItem.substitutes !== undefined ? newItem.substitutes : i.substitutes
                  }
                : i
            ),
          };
        } else {
          // Add new item (backend will assign cart_item_id, but we'll use a temporary one)
          const tempId = Date.now(); // Temporary ID until backend responds
          return {
            ...old,
            items: [
              ...items,
              {
                cart_item_id: tempId,
                product_code: newItem.product_code,
                quantity: newItem.quantity,
                substitutes: newItem.substitutes || [],
                product: products?.find((p: any) => p.product_code === newItem.product_code),
                created_at: new Date().toISOString(),
              },
            ],
          };
        }
      });
      
      return { previousCart };
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      toast({
        title: 'Error',
        description: 'Failed to add item to cart',
        variant: 'destructive',
      });
    },
    onSuccess: (data, variables) => {
      // Only update if backend returns a valid cart structure
      // Backend might return empty object or just success, so merge intelligently
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        
        // If backend returns a full cart with items, use it
        if (data && data.items && Array.isArray(data.items)) {
          // Merge product information from optimistic update
          const mergedItems = data.items.map((item: any) => {
            // Find the optimistic item to preserve product info
            const optimisticItem = old.items?.find((oi: any) => 
              oi.product_code === item.product_code && 
              (oi.cart_item_id === item.cart_item_id || oi.cart_item_id > 1000000000) // temp ID or real ID
            );
            
            return {
              ...item,
              // Preserve product info from optimistic update if backend didn't include it
              product: item.product || optimisticItem?.product,
            };
          });
          
          return {
            ...data,
            items: mergedItems,
          };
        }
        
        // If backend doesn't return cart, keep optimistic update but update item IDs if provided
        if (data && data.cart_item_id) {
          // Backend returned the new item, update the temp ID
          const items = old.items || [];
          return {
            ...old,
            items: items.map((item: any) => {
              // If this is the temp item we just added, update with real ID
              if (item.cart_item_id > 1000000000 && item.product_code === variables.product_code) {
                return {
                  ...item,
                  cart_item_id: data.cart_item_id,
                  ...data, // Merge any other fields from backend
                };
              }
              return item;
            }),
          };
        }
        
        // Keep optimistic update if backend response is not useful
        return old;
      });
      
      toast({ 
        title: 'Added to cart',
        description: 'Product added successfully'
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (id: number) => customerCartApi.removeFromCart(id),
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      
      // Optimistically remove the item
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        const items = old.items || [];
        return {
          ...old,
          items: items.filter((i: any) => i.cart_item_id !== cartItemId),
        };
      });
      
      return { previousCart };
    },
    onError: (err, cartItemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart',
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      // Only update if backend returns a valid cart structure
      if (data && data.items && Array.isArray(data.items)) {
        queryClient.setQueryData(['cart'], (old: any) => {
          if (!old) return old;
          
          // Merge product information from optimistic update
          const mergedItems = data.items.map((item: any) => {
            const optimisticItem = old.items?.find((oi: any) => 
              oi.cart_item_id === item.cart_item_id
            );
            
            return {
              ...item,
              product: item.product || optimisticItem?.product,
            };
          });
          
          return {
            ...data,
            items: mergedItems,
          };
        });
      }
      
      toast({ title: 'Removed from cart' });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, newQuantity }: { cartItemId: number; newQuantity: number }) => {
      return customerCartApi.updateQuantity(cartItemId, newQuantity);
    },
    onMutate: async ({ cartItemId, newQuantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      
      // Optimistically update quantity
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        const items = old.items || [];
        return {
          ...old,
          items: items.map((i: any) =>
            i.cart_item_id === cartItemId
              ? { ...i, quantity: newQuantity }
              : i
          ),
        };
      });
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
    },
    onSuccess: async (data, variables) => {
      // Only update if backend returns a valid cart structure
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        
        // If backend returns a full cart with items, use it
        if (data && data.items && Array.isArray(data.items)) {
          // Merge product information from optimistic update
          const mergedItems = data.items.map((item: any) => {
            const optimisticItem = old.items?.find((oi: any) => 
              oi.cart_item_id === item.cart_item_id
            );
            
            return {
              ...item,
              product: item.product || optimisticItem?.product,
            };
          });
          
          return {
            ...data,
            items: mergedItems,
          };
        }
        
        // Keep optimistic update if backend response is not useful
        return old;
      });
      
      // Assess shortage risk for the updated product
      const updatedCart = queryClient.getQueryData(['cart']) as any;
      const updatedItem = updatedCart?.items?.find((item: any) => item.cart_item_id === variables.cartItemId);
      if (updatedItem) {
        setAssessingRiskFor(prev => new Set([...prev, updatedItem.product_code]));
        try {
          const today = format(new Date(), 'yyyy-MM-dd');
          const response = await customerProductsApi.assessProductsRisk([{
            product_code: updatedItem.product_code,
            order_qty: variables.newQuantity,
            order_created_date: today,
            requested_delivery_date: deliveryDate,
          }]);
          
          if (response.predictions && Array.isArray(response.predictions) && response.predictions.length > 0) {
            const prediction = response.predictions[0];
            setShortageRisks(prev => ({
              ...prev,
              [prediction.product_code]: prediction.shortage_probability ?? null,
            }));
          }
        } catch (error) {
          console.error('Failed to assess shortage risk for updated item:', error);
        } finally {
          setAssessingRiskFor(prev => {
            const newSet = new Set(prev);
            newSet.delete(updatedItem.product_code);
            return newSet;
          });
        }
      }
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: (data: any) => customerOrdersApi.placeOrder(data),
    onMutate: async () => {
      // Optimistically clear the cart
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      
      // Clear cart optimistically
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: [],
        };
      });
      
      return { previousCart };
    },
    onSuccess: async (data) => {
      // Clear cart on backend
      try {
        await customerCartApi.clearCart();
      } catch (error) {
        console.error('Failed to clear cart on backend:', error);
      }
      
      // Ensure cart is cleared in cache
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: [],
        };
      });
      
      toast({ 
        title: 'Order placed successfully!',
        description: 'Your order has been submitted'
      });
      navigate(`/customer/orders/${data.order_id}`);
    },
    onError: (error: any, variables, context) => {
      // Rollback cart on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to place order',
        variant: 'destructive',
      });
    },
  });

  const loadSimilar = async (productCode: string) => {
    setLoadingSimilar(true);
    setSimilarProducts([]);
    try {
      const similar = await customerProductsApi.getSimilarProducts(productCode);
      setSimilarProducts(similar);
      
      // Assess shortage risk for similar products using batch endpoint
      if (similar.length > 0) {
        const itemsToAssess = similar.map((product: any) => ({
          product_code: product.product_code,
          quantity: 1, // Default quantity for similar products
        }));
        await assessShortageRisk(itemsToAssess);
      }
    } catch (error) {
      console.error('Failed to load similar products', error);
      setSimilarProducts([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleAddToCart = (product: any) => {
    // Check if product is already in cart
    const existingItem = (cart?.items || []).find((item) => item.product_code === product.product_code);
    
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

    if (!cart || (cart.items || []).length === 0) {
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

  // Track the product code for the item being edited (more stable than cart_item_id)
  const [editingProductCode, setEditingProductCode] = useState<string | null>(null);
  // Track if we're updating substitutes to prevent dialog from closing during updates
  const [isUpdatingSubstitutes, setIsUpdatingSubstitutes] = useState(false);
  
  // Refresh substitute dialog when cart updates
  useEffect(() => {
    if (substituteDialogOpen && editingProductCode && !isUpdatingSubstitutes) {
      // Dialog is open, find the item by product code (more stable than cart_item_id)
      // Check both the cart data and the query cache (which includes optimistic updates)
      const cartData = queryClient.getQueryData(['cart']) as any;
      const items = cartData?.items || cart?.items || [];
      const cartItem = items.find((item: any) => item.product_code === editingProductCode);
      
      if (cartItem) {
        // Update editingCartItemId to the current cart_item_id
        setEditingCartItemId(cartItem.cart_item_id);
      } else if (!cartItem && items.length > 0) {
        // Item was removed from cart (and not just temporarily during update), close dialog
        setSubstituteDialogOpen(false);
        setEditingCartItemId(null);
        setEditingProductCode(null);
      }
    }
  }, [cart, substituteDialogOpen, editingProductCode, isUpdatingSubstitutes, queryClient]);

  const openSubstituteDialog = async (cartItemId: number) => {
    const cartItem = (cart?.items || []).find((item) => item.cart_item_id === cartItemId);
    if (!cartItem) return;
    
    setEditingCartItemId(cartItemId);
    setEditingProductCode(cartItem.product_code); // Track by product code for stability
    setSubstituteDialogOpen(true);
    
    // Load AI substitute recommendations
    if (cartItem?.product_code) {
      setLoadingSubstitutes(true);
      try {
        const recommendations = await customerProductsApi.getSimilarProducts(cartItem.product_code);
        setSubstituteRecommendations(recommendations);
        
        // Assess shortage risk for recommendations using batch endpoint with delivery date
        if (recommendations.length > 0) {
          const productCodes = recommendations.map((product: any) => product.product_code);
          setAssessingRiskFor(prev => new Set([...prev, ...productCodes]));
          
          try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const riskRequests = recommendations.map((product: any) => ({
              product_code: product.product_code,
              order_qty: cartItem.quantity, // Use cart item quantity
              order_created_date: today,
              requested_delivery_date: deliveryDate, // Use current delivery date
            }));
            
            const response = await customerProductsApi.assessProductsRisk(riskRequests);
            const riskMap: Record<string, number | null> = {};
            
            if (response.predictions && Array.isArray(response.predictions)) {
              response.predictions.forEach((prediction: any) => {
                riskMap[prediction.product_code] = prediction.shortage_probability ?? null;
              });
            }
            
            setShortageRisks(prev => ({ ...prev, ...riskMap }));
          } catch (error) {
            console.error('Failed to assess shortage risk for recommendations:', error);
          } finally {
            setAssessingRiskFor(prev => {
              const newSet = new Set(prev);
              productCodes.forEach(code => newSet.delete(code));
              return newSet;
            });
          }
        }
      } catch (error) {
        console.error('Failed to load substitute recommendations', error);
        setSubstituteRecommendations([]);
        toast({
          title: 'Failed to load AI recommendations',
          description: 'Please try again',
          variant: 'destructive',
        });
      } finally {
        setLoadingSubstitutes(false);
      }
    }
  };

  const openSimilarDialog = (product: any) => {
    setSelectedProductForSimilar(product);
    setSimilarDialogOpen(true);
    loadSimilar(product.product_code);
  };

  const addSubstitute = async (substituteCode: string, priority: number) => {
    // Find item by product code if cart_item_id doesn't match (item was re-added)
    const cartItem = editingProductCode 
      ? (cart?.items || []).find((item) => item.product_code === editingProductCode)
      : (cart?.items || []).find((item) => item.cart_item_id === editingCartItemId);
    
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

    // Update the cart item in place instead of remove/add to preserve order
    const updatedSubstitutes = [...existingSubs, { substitute_product_code: substituteCode, priority }];
    
    // Set flag to prevent dialog from closing during update
    setIsUpdatingSubstitutes(true);
    
    // Use updateQuantity mutation to update the item with new substitutes
    // But first, we need to update the cart optimistically
    await queryClient.cancelQueries({ queryKey: ['cart'] });
    const previousCart = queryClient.getQueryData(['cart']);
    
    // Optimistically update the cart item with new substitutes
    queryClient.setQueryData(['cart'], (old: any) => {
      if (!old) return old;
      const items = old.items || [];
      return {
        ...old,
        items: items.map((item: any) =>
          item.product_code === editingProductCode || item.cart_item_id === editingCartItemId
            ? { ...item, substitutes: updatedSubstitutes }
            : item
        ),
      };
    });
    
    // Update on backend by removing and re-adding with new substitutes
    // We need to preserve the item's position in the cart
    const currentCartItem = (cart?.items || []).find((item) => 
      item.product_code === editingProductCode || item.cart_item_id === editingCartItemId
    );
    const itemIndex = currentCartItem 
      ? (cart?.items || []).findIndex((item) => 
          item.product_code === editingProductCode || item.cart_item_id === editingCartItemId
        )
      : -1;
    
    try {
      if (currentCartItem) {
        await removeFromCartMutation.mutateAsync(currentCartItem.cart_item_id);
      }
      
      // After removal, update the cart to preserve order when re-adding
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        const items = old.items || [];
        // Insert at the same position
        const newItem = {
          cart_item_id: Date.now(), // Temporary ID
          product_code: cartItem.product_code,
          quantity: cartItem.quantity,
          substitutes: updatedSubstitutes,
          product: cartItem.product,
          created_at: new Date().toISOString(),
        };
        
        const newItems = [...items];
        newItems.splice(itemIndex >= 0 ? itemIndex : items.length, 0, newItem);
        
        return {
          ...old,
          items: newItems,
        };
      });
      
      await addToCartMutation.mutateAsync({
        product_code: cartItem.product_code,
        quantity: cartItem.quantity,
        substitutes: updatedSubstitutes,
      });
      
      // Update editingCartItemId to the new item's ID after re-adding
      const updatedCart = queryClient.getQueryData(['cart']) as any;
      const newCartItem = updatedCart?.items?.find((item: any) => 
        item.product_code === editingProductCode
      );
      if (newCartItem) {
        setEditingCartItemId(newCartItem.cart_item_id);
      }
      
      // Assess shortage risk for the newly added substitute
      setAssessingRiskFor(prev => new Set([...prev, substituteCode]));
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await customerProductsApi.assessProductsRisk([{
          product_code: substituteCode,
          order_qty: cartItem.quantity,
          order_created_date: today,
          requested_delivery_date: deliveryDate,
        }]);
        
        if (response.predictions && Array.isArray(response.predictions) && response.predictions.length > 0) {
          const prediction = response.predictions[0];
          setShortageRisks(prev => ({
            ...prev,
            [prediction.product_code]: prediction.shortage_probability ?? null,
          }));
        }
      } catch (error) {
        console.error('Failed to assess shortage risk for substitute:', error);
      } finally {
        setAssessingRiskFor(prev => {
          const newSet = new Set(prev);
          newSet.delete(substituteCode);
          return newSet;
        });
      }
      
      toast({ 
        title: `Substitute ${priority} added`,
        description: 'AI-powered substitution configured'
      });
    } catch (error) {
      // Rollback on error
      if (previousCart) {
        queryClient.setQueryData(['cart'], previousCart);
      }
      toast({
        title: 'Error',
        description: 'Failed to add substitute',
        variant: 'destructive',
      });
    } finally {
      // Clear the flag after update completes
      setIsUpdatingSubstitutes(false);
    }
  };

  const removeSubstitute = async (priority: number) => {
    // Find item by product code if cart_item_id doesn't match (item was re-added)
    const cartItem = editingProductCode 
      ? (cart?.items || []).find((item) => item.product_code === editingProductCode)
      : (cart?.items || []).find((item) => item.cart_item_id === editingCartItemId);
    
    if (!cartItem) return;

    const existingSubs = cartItem.substitutes || [];
    const updatedSubs = existingSubs.filter((sub: any) => sub.priority !== priority);

    // Set flag to prevent dialog from closing during update
    setIsUpdatingSubstitutes(true);

    // Optimistically update the cart
    await queryClient.cancelQueries({ queryKey: ['cart'] });
    const previousCart = queryClient.getQueryData(['cart']);
    
    queryClient.setQueryData(['cart'], (old: any) => {
      if (!old) return old;
      const items = old.items || [];
      return {
        ...old,
        items: items.map((item: any) =>
          item.product_code === editingProductCode || item.cart_item_id === editingCartItemId
            ? { ...item, substitutes: updatedSubs }
            : item
        ),
      };
    });
    
    // Update on backend - preserve item position
    const currentCartItem = (cart?.items || []).find((item) => 
      item.product_code === editingProductCode || item.cart_item_id === editingCartItemId
    );
    const itemIndex = currentCartItem 
      ? (cart?.items || []).findIndex((item) => 
          item.product_code === editingProductCode || item.cart_item_id === editingCartItemId
        )
      : -1;
    
    try {
      if (currentCartItem) {
        await removeFromCartMutation.mutateAsync(currentCartItem.cart_item_id);
      }
      
      // After removal, update the cart to preserve order when re-adding
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        const items = old.items || [];
        // Insert at the same position
        const newItem = {
          cart_item_id: Date.now(), // Temporary ID
          product_code: cartItem.product_code,
          quantity: cartItem.quantity,
          substitutes: updatedSubs,
          product: cartItem.product,
          created_at: new Date().toISOString(),
        };
        
        const newItems = [...items];
        newItems.splice(itemIndex >= 0 ? itemIndex : items.length, 0, newItem);
        
        return {
          ...old,
          items: newItems,
        };
      });
      
      await addToCartMutation.mutateAsync({
        product_code: cartItem.product_code,
        quantity: cartItem.quantity,
        substitutes: updatedSubs,
      });
      
      // Update editingCartItemId to the new item's ID after re-adding
      const updatedCart = queryClient.getQueryData(['cart']) as any;
      const newCartItem = updatedCart?.items?.find((item: any) => 
        item.product_code === editingProductCode
      );
      if (newCartItem) {
        setEditingCartItemId(newCartItem.cart_item_id);
      }
      
      toast({ title: `Substitute ${priority} removed` });
    } catch (error) {
      // Rollback on error
      if (previousCart) {
        queryClient.setQueryData(['cart'], previousCart);
      }
      toast({
        title: 'Error',
        description: 'Failed to remove substitute',
        variant: 'destructive',
      });
    } finally {
      // Clear the flag after update completes
      setIsUpdatingSubstitutes(false);
    }
  };

  const handleAddSimilarToCart = (product: any, replace: boolean = false) => {
    if (replace && selectedProductForSimilar) {
      // Replace the original product in cart
      const existingItem = (cart?.items || []).find((item) => item.product_code === selectedProductForSimilar.product_code);
      if (existingItem) {
        removeFromCartMutation.mutate(existingItem.cart_item_id);
      }
    }
    handleAddToCart(product);
    if (!replace) {
      setSimilarDialogOpen(false);
    }
  };

  const cartTotal = (cart?.items || []).reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Product Browser */}
      <div className="col-span-2 space-y-4 overflow-y-auto">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={(value) => { setCategory(value); setSubCategory('all'); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={categoriesLoading ? "Loading..." : "Category"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoriesLoading ? (
                <SelectItem value="loading" disabled>Loading categories...</SelectItem>
              ) : categoriesError ? (
                <SelectItem value="error" disabled>Error loading categories</SelectItem>
              ) : categories && categories.length > 0 ? (
                categories.map((cat: Category) => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="empty" disabled>No categories available</SelectItem>
              )}
            </SelectContent>
          </Select>
          {category !== 'all' && availableSubCategories.length > 0 && (
            <Select value={subCategory} onValueChange={setSubCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sub Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sub Categories</SelectItem>
                {availableSubCategories.map((subCat: string) => (
                  <SelectItem key={subCat} value={subCat}>
                    {subCat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={temperatureZone} onValueChange={setTemperatureZone}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Temperature Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
              <SelectItem value="chilled">Chilled</SelectItem>
              <SelectItem value="ambient">Ambient</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {productsLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No products found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 items-stretch">
              {products.map((product: any) => {
            const isInCart = (cart?.items || []).some((item) => item.product_code === product.product_code);
            
            return (
              <Card key={product.product_code} className="hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col h-full min-h-0">

                <CardHeader className="flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.product_name}</CardTitle>
                      {product.category && (
                        <Badge variant="outline" className="mt-1">{product.category}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-3 min-h-0 justify-end">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">
                      {product.price !== null && product.price !== undefined 
                        ? `€${product.price.toFixed(2)}` 
                        : 'Price not available'}
                    </span>
                    {product.unit_size && product.unit_type && (
                      <span className="text-sm text-muted-foreground">
                        {product.unit_size} {product.unit_type}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto">
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
                          {/* <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full animate-ping" /> */}
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
                          {loadingSimilar ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Wand2 className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
                              <p>Loading AI recommendations...</p>
                            </div>
                          ) : similarProducts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 items-stretch">
                              {similarProducts.map((similar: any) => {
                                // const similarRiskScore = shortageRisks[similar.product_code] ?? similar.risk_score;
                                // const similarRisk = getShortageRiskCategory(similarRiskScore);
                                return (
                                  <Card key={similar.product_code} className="hover:shadow-md transition-shadow flex flex-col h-full min-h-0">
                                    <CardContent className="p-4 flex-1 flex flex-col space-y-3 min-h-0 justify-between">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <h4 className="font-medium">{similar.product_name}</h4>
                                          {similar.category && (
                                            <Badge variant="outline" className="mt-1 text-xs">
                                              {similar.category}
                                            </Badge>
                                          )}
                                        </div>
                                        {/* <Badge 
                                          variant="outline"
                                          className={`${similarRisk.bgColor} ${similarRisk.borderColor} border`}
                                          style={{ color: 'white' }}
                                        >
                                          {similarRisk.label}
                                        </Badge> */}
                                      </div>
                                      <div className="flex-1 flex flex-col space-y-3 min-h-0 justify-end">                                      <div className="flex justify-between items-center">
                                        <span className="font-bold">
                                          {similar.price !== null && similar.price !== undefined 
                                            ? `€${similar.price.toFixed(2)}` 
                                            : 'Price not available'}
                                        </span>
                                        {similar.unit_size && similar.unit_type && (
                                          <span className="text-xs text-muted-foreground">
                                            {similar.unit_size} {similar.unit_type}
                                          </span>
                                        )}
                                      </div>
                                      {/* AI Shortage Risk Score Display */}
                                      {/* {similarRiskScore !== null && similarRiskScore !== undefined && (
                                        <div className="flex items-center gap-2 text-xs">
                                          <Zap className="h-3 w-3 text-purple-500" />
                                          <span className="text-muted-foreground">AI Shortage Risk:</span>
                                          <span className="font-medium">{(similarRiskScore * 100).toFixed(0)}%</span>
                                          <Badge 
                                          variant="outline"
                                          className={`${similarRisk.bgColor} ${similarRisk.borderColor} border`}
                                          style={{ color: 'white' }}
                                        >
                                          {similarRisk.label}
                                        </Badge>
                                        </div>
                                      )} */}
                                      <div className="flex gap-2 mt-auto">
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
            
            {/* Pagination Controls */}
            {productsResponse && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {productsResponse.skip + 1} to {Math.min(productsResponse.skip + productsResponse.limit, productsResponse.total)} of {productsResponse.total} products
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      Page {currentPage + 1} of {Math.ceil(productsResponse.total / pageSize) || 1}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!productsResponse.has_more}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart */}
      <div className="space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart ({(cart?.items || []).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(cart?.items || []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Your cart is empty</p>
                <p className="text-xs mt-1">Add products to get started</p>
              </div>
            ) : (
              (cart?.items || []).map((item) => {
                const itemRiskScore = shortageRisks[item.product_code] ?? null;
                const itemRisk = getShortageRiskCategory(itemRiskScore);
                const isAssessing = assessingRiskFor.has(item.product_code);
                return (
                  <div key={item.cart_item_id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.product_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {isAssessing ? (
                            <Badge 
                              variant="outline"
                              className="bg-muted border-muted-foreground/20 text-xs"
                            >
                              <Sparkles className="h-2 w-2 mr-1 animate-pulse" />
                              Calculating Shortage Risk...
                            </Badge>
                          ) : itemRiskScore !== null && itemRiskScore !== undefined ? (
                            <>
                              <Badge 
                                variant="outline"
                                className={`${itemRisk.bgColor} ${itemRisk.borderColor} border text-xs`}
                                style={{ color: 'white' }}
                              >
                                <Sparkles className="h-2 w-2 mr-1" style={{ color: 'white' }} />
                                <span>{itemRisk.label}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {(itemRiskScore * 100).toFixed(0)}% shortage risk
                              </span>
                            </>
                          ) : null}
                        </div>
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
                      {item.substitutes && (item.substitutes || []).length > 0 && (
                        <div className="space-y-1">
                          {item.substitutes.map((sub: any) => {
                            const subProduct = 
                              products?.find((p: any) => p.product_code === sub.substitute_product_code) ||
                              substituteRecommendations.find((p: any) => p.product_code === sub.substitute_product_code) ||
                              similarProducts.find((p: any) => p.product_code === sub.substitute_product_code) ||
                              substituteProducts[sub.substitute_product_code];
                            const subRiskScore = shortageRisks[sub.substitute_product_code] ?? null;
                            const subRisk = getShortageRiskCategory(subRiskScore);
                            return (
                              <div key={sub.priority} className="text-xs bg-purple-50 dark:bg-purple-950/20 p-2 rounded border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-1 mb-1">
                                  <Sparkles className="h-2 w-2 text-purple-500" />
                                  <span className="font-medium">Priority {sub.priority}:</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>{subProduct?.product_name || sub.substitute_product_code || 'Product'}</span>
                                  {subRiskScore !== null && subRiskScore !== undefined && (
                                    <Badge 
                                      variant="outline"
                                      className={`${subRisk.bgColor} ${subRisk.borderColor} border text-xs ml-2`}
                                      style={{ color: 'white' }}
                                    >
                                      {subRisk.label}
                                    </Badge>
                                  )}
                                </div>
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

            {cart && (cart.items || []).length > 0 && (
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
          
          {editingProductCode && (() => {
            // Find item by product code for stability (cart_item_id may change)
            const cartItem = (cart?.items || []).find((item) => 
              item.product_code === editingProductCode
            );
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
                      // Try to find product in multiple sources
                      const subProduct = 
                        products?.find((p: any) => p.product_code === sub.substitute_product_code) ||
                        substituteRecommendations.find((p: any) => p.product_code === sub.substitute_product_code) ||
                        similarProducts.find((p: any) => p.product_code === sub.substitute_product_code) ||
                        substituteProducts[sub.substitute_product_code];
                      const subRiskScore = shortageRisks[sub.substitute_product_code] ?? null;
                      const subRisk = getShortageRiskCategory(subRiskScore);
                      
                      return (
                        <div key={sub.priority} className="flex justify-between items-center p-3 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Priority {sub.priority}</Badge>
                              <Sparkles className="h-3 w-3 text-purple-500" />
                            </div>
                            <p className="font-medium mt-1">
                              {subProduct?.product_name || sub.substitute_product_code || 'Product'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {subProduct?.price !== null && subProduct?.price !== undefined ? (
                                <p className="text-sm text-muted-foreground">€{subProduct.price.toFixed(2)}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Price not available</p>
                              )}
                              {subRiskScore !== null && subRiskScore !== undefined && (
                                <Badge 
                                  variant="outline"
                                  className={`${subRisk.bgColor} ${subRisk.borderColor} border text-xs`}
                                  style={{ color: 'white' }}
                                >
                                  {subRisk.label}
                                </Badge>
                              )}
                            </div>
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
                
                {/* AI-Powered Recommendations */}
                {existingSubs.length < 2 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">AI-Powered Recommendations</h3>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        Powered by AI
                      </Badge>
                    </div>
                    {loadingSubstitutes ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wand2 className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
                        <p>Loading AI recommendations...</p>
                      </div>
                    ) : substituteRecommendations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wand2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No AI recommendations available</p>
                        <p className="text-xs mt-1">Try selecting from all products</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {substituteRecommendations
                          .filter((p: any) => 
                            p.product_code !== cartItem?.product_code &&
                            !existingSubs.some((sub: any) => sub.substitute_product_code === p.product_code)
                          )
                          .map((product: any) => {
                            const productRiskScore = shortageRisks[product.product_code] ?? product.risk_score;
                            const productRisk = getShortageRiskCategory(productRiskScore);
                            const isAssessing = assessingRiskFor.has(product.product_code);
                            return (
                              <div key={product.product_code} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted transition-colors">
                                <div className="flex-1">
                                  <p className="font-medium">{product.product_name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-bold">
                                      {product.price !== null && product.price !== undefined
                                        ? `€${product.price.toFixed(2)}`
                                        : 'Price not available'}
                                    </span>
                                    {isAssessing ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-muted border-muted-foreground/20 text-xs"
                                      >
                                        <Sparkles className="h-2 w-2 mr-1 animate-pulse" />
                                        Calculating...
                                      </Badge>
                                    ) : productRiskScore !== null && productRiskScore !== undefined ? (
                                      <>
                                        <Badge
                                          variant="outline"
                                          className={`${productRisk.bgColor} ${productRisk.borderColor} border`}
                                          style={{ color: 'white' }}
                                        >
                                          {productRisk.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {(productRiskScore * 100).toFixed(0)}% shortage risk
                                        </span>
                                      </>
                                    ) : null}
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
                    )}
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

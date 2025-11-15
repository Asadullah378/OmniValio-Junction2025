import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminOrdersApi, adminCustomersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { ChatWidget } from '@/components/ChatWidget';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Package, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle,
  MessageSquare,
  Truck,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { OrderWithDetails, OrderLine, OrderSubstitute, OrderChange } from '@/lib/types';

export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusNotes, setStatusNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: order, isLoading, error, refetch } = useQuery<OrderWithDetails>({
    queryKey: ['admin-order', orderId],
    queryFn: () => adminOrdersApi.getOrder(orderId!),
    enabled: !!orderId,
  });

  // Fetch customer information for display
  const { data: customer } = useQuery({
    queryKey: ['customer', order?.customer_id],
    queryFn: () => adminCustomersApi.getCustomer(order!.customer_id),
    enabled: !!order?.customer_id,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-order-messages', orderId],
    queryFn: () => adminOrdersApi.getOrderMessages(orderId!),
    enabled: !!orderId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      adminOrdersApi.updateOrderStatus(orderId!, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['actions-needed'] }); // Invalidate customer alerts
      
      // If status is waiting_for_customer_action, it should create an alert (backend handles this)
      if (variables.status === 'waiting_for_customer_action') {
        toast({ 
          title: 'Status updated', 
          description: 'Customer has been notified and an alert has been created.' 
        });
      } else if (variables.status === 'cancelled') {
        toast({ 
          title: 'Order cancelled', 
          description: 'Order has been cancelled and invoice has been removed.' 
        });
      } else {
        toast({ title: 'Status updated successfully' });
      }
      
      setStatusNotes('');
      setNewStatus('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  const replaceProductMutation = useMutation({
    mutationFn: ({ lineId, substituteCode, oldProductName, newProductName }: { 
      lineId: number; 
      substituteCode: string;
      oldProductName: string;
      newProductName: string;
    }) =>
      adminOrdersApi.replaceProduct(orderId!, lineId, substituteCode),
    onSuccess: (data: OrderChange, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] }); // Invalidate invoices for regeneration
      
      // Automatically send a message about the product replacement
      const messageContent = `We've replaced "${variables.oldProductName}" with "${variables.newProductName}" in your order. A new invoice has been generated to reflect this change.`;
      
      sendMessageMutation.mutate(messageContent, {
        onSuccess: () => {
          toast({ 
            title: 'Product replaced successfully', 
            description: 'Customer has been notified via message and invoice has been regenerated.' 
          });
        },
        onError: () => {
          toast({ 
            title: 'Product replaced', 
            description: 'Note: Failed to send automatic notification message.' 
          });
        }
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to replace product',
        variant: 'destructive',
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => adminOrdersApi.sendOrderMessage(orderId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-messages', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
    },
  });

  const handleSendMessage = async (content: string) => {
    await sendMessageMutation.mutateAsync(content);
  };

  const handleStatusUpdate = () => {
    if (!newStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }
    updateStatusMutation.mutate({ status: newStatus, notes: statusNotes || undefined });
  };

  // Calculate total order value
  const calculateTotal = () => {
    return order?.order_lines?.reduce((sum, line) => {
      const price = line.product?.price || 0;
      return sum + (price * line.ordered_qty);
    }, 0) || 0;
  };

  // Get substitutes for a specific line
  const getSubstitutesForLine = (lineId: number): OrderSubstitute[] => {
    return order?.order_substitutes?.filter(sub => sub.line_id === lineId) || [];
  };

  // Check if a line was replaced
  const isLineReplaced = (line: OrderLine): boolean => {
    return line.line_status === 'REPLACED' || 
           getSubstitutesForLine(line.line_id).some(sub => sub.is_used);
  };

  // Get the used substitute for a line
  const getUsedSubstitute = (lineId: number): OrderSubstitute | null => {
    return order?.order_substitutes?.find(sub => sub.line_id === lineId && sub.is_used) || null;
  };

  // Get order changes for a line
  const getOrderChangesForLine = (lineId: number): OrderChange[] => {
    const line = order?.order_lines?.find(l => l.line_id === lineId);
    return line?.order_changes || [];
  };

  // Format delivery window
  const formatDeliveryWindow = () => {
    if (!order?.delivery_window_start) return null;
    const start = new Date(order.delivery_window_start);
    const end = order.delivery_window_end ? new Date(order.delivery_window_end) : null;
    const isValidStart = !isNaN(start.getTime());
    const isValidEnd = end && !isNaN(end.getTime());
    
    if (!isValidStart) return null;
    
    return `${format(start, 'HH:mm')} - ${isValidEnd ? format(end, 'HH:mm') : format(start, 'HH:mm')}`;
  };

  // Format delivery date
  const formatDeliveryDate = () => {
    if (!order?.delivery_date) return 'N/A';
    const date = new Date(order.delivery_date);
    return !isNaN(date.getTime()) ? format(date, 'PPP') : 'Invalid date';
  };

  // Format order date
  const formatOrderDate = () => {
    if (!order?.order_datetime) return 'N/A';
    const date = new Date(order.order_datetime);
    return !isNaN(date.getTime()) ? format(date, 'PPP p') : 'Invalid date';
  };

  if (isLoading) {
    return <LoadingSpinner className="h-64" text="Loading order details..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : 'Failed to load order'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!order) {
    return <EmptyState message="Order not found" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground mt-1">
            Placed on {formatOrderDate()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip type="order" status={order.status} />
          {order.overall_order_risk !== null && order.overall_order_risk !== undefined && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Risk: {(order.overall_order_risk * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Customer
                  </p>
                  <p className="font-medium">{customer?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Delivery Date
                  </p>
                  <p className="font-medium">{formatDeliveryDate()}</p>
                </div>
                {formatDeliveryWindow() && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Delivery Window
                    </p>
                    <p className="font-medium">{formatDeliveryWindow()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Channel</p>
                  <Badge variant="secondary" className="capitalize">{order.channel}</Badge>
                </div>
              </div>

              <Separator />

              {/* Status Update */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Order Status</label>
                <div className="flex gap-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select new status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placed">Placed</SelectItem>
                      <SelectItem value="under_risk">Under Risk</SelectItem>
                      <SelectItem value="waiting_for_customer_action">Waiting for Customer Action</SelectItem>
                      <SelectItem value="picking">Picking</SelectItem>
                      <SelectItem value="delivering">Delivering</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Optional notes..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="flex-1"
                    rows={1}
                  />
                  <Button 
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{order.order_lines?.length || 0} items in this order</CardDescription>
            </CardHeader>
            <CardContent>
              {order.order_lines && order.order_lines.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {order.order_lines.map((line) => {
                      const substitutes = getSubstitutesForLine(line.line_id);
                      const usedSubstitute = getUsedSubstitute(line.line_id);
                      const isReplaced = isLineReplaced(line);
                      const productName = line.product?.product_name || 'Unknown Product';
                      const unitPrice = line.product?.price || 0;
                      const lineTotal = unitPrice * line.ordered_qty;
                      const orderChanges = getOrderChangesForLine(line.line_id);

                      return (
                        <div key={line.line_id} className="border rounded-lg p-4 space-y-3">
                          {/* Main Product Info */}
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium text-lg">{productName}</p>
                                {isReplaced && (
                                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                    Replaced
                                  </Badge>
                                )}
                                {line.line_status === 'PARTIAL' && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    Partial
                                  </Badge>
                                )}
                                {line.line_status === 'ZERO' && (
                                  <Badge variant="destructive">Unavailable</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Quantity</p>
                                  <p className="font-medium">{line.ordered_qty}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Unit Price</p>
                                  <p className="font-medium">€{unitPrice.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Line Total</p>
                                  <p className="font-medium">€{lineTotal.toFixed(2)}</p>
                                </div>
                              </div>

                              {line.delivered_qty !== line.ordered_qty && (
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                  <span className="text-muted-foreground">
                                    Delivered: {line.delivered_qty} of {line.ordered_qty}
                                  </span>
                                </div>
                              )}

                              {line.shortage_flag && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  Shortage: {(line.shortage_ratio * 100).toFixed(0)}%
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Replacement Information */}
                          {isReplaced && usedSubstitute && usedSubstitute.substitute_product && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-900">
                                    This item was replaced with:
                                  </p>
                                  <p className="text-sm text-blue-700 mt-1">
                                    {usedSubstitute.substitute_product.product_name}
                                  </p>
                                  {usedSubstitute.substitute_product.price && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Price: €{usedSubstitute.substitute_product.price.toFixed(2)}
                                    </p>
                                  )}
                                  {orderChanges.length > 0 && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Reason: {orderChanges[0].change_reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Substitutes (if not used) */}
                          {substitutes.length > 0 && !isReplaced && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-purple-900 mb-2">
                                    AI-Powered Substitutes Available:
                                  </p>
                                  <div className="space-y-2">
                                    {substitutes
                                      .sort((a, b) => a.priority - b.priority)
                                      .map((sub) => (
                                        <div key={sub.substitute_id} className="flex items-center justify-between p-2 bg-white rounded border border-purple-200">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                                              Priority {sub.priority}
                                            </Badge>
                                            <span className="text-sm font-medium">
                                              {sub.substitute_product?.product_name || sub.substitute_product_code}
                                            </span>
                                            {sub.substitute_product?.price && (
                                              <span className="text-xs text-purple-600">
                                                (€{sub.substitute_product.price.toFixed(2)})
                                              </span>
                                            )}
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              if (sub.substitute_product?.product_name && productName) {
                                                replaceProductMutation.mutate({ 
                                                  lineId: line.line_id, 
                                                  substituteCode: sub.substitute_product_code,
                                                  oldProductName: productName,
                                                  newProductName: sub.substitute_product.product_name
                                                });
                                              }
                                            }}
                                            disabled={replaceProductMutation.isPending}
                                          >
                                            Replace Product
                                          </Button>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Customer Comments */}
                          {line.customer_comments && (
                            <div className="text-sm border-t pt-2">
                              <p className="text-muted-foreground">Customer Note:</p>
                              <p className="mt-1 italic">{line.customer_comments}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Order Total */}
                  <div className="pt-4 border-t mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Order Total</span>
                      <span className="text-2xl font-bold">€{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState message="No order lines found" />
              )}
            </CardContent>
          </Card>

          {/* Tracking History */}
          {order.tracking_history && order.tracking_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Order Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.tracking_history.map((event, idx) => {
                    const eventDate = new Date(event.created_at);
                    const isValidDate = !isNaN(eventDate.getTime());
                    
                    return (
                      <div key={event.tracking_id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            idx === 0 ? 'bg-primary' : 'bg-muted'
                          }`} />
                          {idx < order.tracking_history.length - 1 && (
                            <div className="w-0.5 h-full bg-border my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusChip type="order" status={event.status} />
                            {isValidDate && (
                              <span className="text-xs text-muted-foreground">
                                {format(eventDate, 'PPP p')}
                              </span>
                            )}
                          </div>
                          {event.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                          )}
                          {event.updated_by && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Updated by: {event.updated_by}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="flex flex-col" style={{ height: '75vh' }}>
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Order Communication
                </CardTitle>
                <CardDescription>Communicate with customer about this order</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <ChatWidget
                  messages={messages || []}
                  onSendMessage={handleSendMessage}
                  placeholder="Type your message about this order..."
                  className="h-full"
                  customerName={customer?.name}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerOrdersApi, customerDashboardApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusChip } from '@/components/StatusChip';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { ChatWidget } from '@/components/ChatWidget';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Package, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { OrderWithDetails, OrderLine, OrderSubstitute } from '@/lib/types';

export default function OrderDetail() {
  const { orderId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading, error, refetch } = useQuery<OrderWithDetails>({
    queryKey: ['customer-order', orderId],
    queryFn: () => customerOrdersApi.getOrder(orderId!),
    enabled: !!orderId,
    retry: 1,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['order-messages', orderId],
    queryFn: () => customerOrdersApi.getOrderMessages(orderId!),
    enabled: !!orderId,
    retry: 1,
  });

  // Fetch customer name for chat display
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => customerDashboardApi.getDashboard(),
  });
  const customerName = dashboard?.customer?.name;

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => customerOrdersApi.sendOrderMessage(orderId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-messages', orderId] });
      queryClient.invalidateQueries({ queryKey: ['customer-order', orderId] });
      toast({ title: 'Message sent successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = async (content: string) => {
    await sendMessageMutation.mutateAsync(content);
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
    return <EmptyState title="Order not found" description="The order you're looking for doesn't exist." />;
  }

  // Calculate total order value
  const calculateTotal = () => {
    return order.order_lines?.reduce((sum, line) => {
      const price = line.product?.price || 0;
      return sum + (price * line.ordered_qty);
    }, 0) || 0;
  };

  // Get substitutes for a specific line
  const getSubstitutesForLine = (lineId: number): OrderSubstitute[] => {
    return order.order_substitutes?.filter(sub => sub.line_id === lineId) || [];
  };

  // Check if a line was replaced
  const isLineReplaced = (line: OrderLine): boolean => {
    return line.line_status === 'REPLACED' || 
           getSubstitutesForLine(line.line_id).some(sub => sub.is_used);
  };

  // Get the used substitute for a line
  const getUsedSubstitute = (lineId: number): OrderSubstitute | null => {
    return order.order_substitutes?.find(sub => sub.line_id === lineId && sub.is_used) || null;
  };

  // Format delivery window
  const formatDeliveryWindow = () => {
    if (!order.delivery_window_start) return null;
    const start = new Date(order.delivery_window_start);
    const end = order.delivery_window_end ? new Date(order.delivery_window_end) : null;
    const isValidStart = !isNaN(start.getTime());
    const isValidEnd = end && !isNaN(end.getTime());
    
    if (!isValidStart) return null;
    
    return `${format(start, 'HH:mm')} - ${isValidEnd ? format(end, 'HH:mm') : format(start, 'HH:mm')}`;
  };

  // Format delivery date
  const formatDeliveryDate = () => {
    if (!order.delivery_date) return 'N/A';
    const date = new Date(order.delivery_date);
    return !isNaN(date.getTime()) ? format(date, 'PPP') : 'Invalid date';
  };

  // Format order date
  const formatOrderDate = () => {
    if (!order.order_datetime) return 'N/A';
    const date = new Date(order.order_datetime);
    return !isNaN(date.getTime()) ? format(date, 'PPP p') : 'Invalid date';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Your Order</h1>
          <p className="text-muted-foreground mt-1">
            Placed on {formatOrderDate()}
          </p>
        </div>
        <StatusChip type="order" status={order.status} />
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
                    <Calendar className="h-3 w-3" />
                    Delivery Date
                  </p>
                  <p className="font-medium mt-1">{formatDeliveryDate()}</p>
                </div>
                {formatDeliveryWindow() && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Delivery Window
                    </p>
                    <p className="font-medium mt-1">{formatDeliveryWindow()}</p>
                  </div>
                )}
              </div>
              
              {order.overall_order_risk !== null && order.overall_order_risk !== undefined && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Order Risk: </span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {(order.overall_order_risk * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_lines && order.order_lines.length > 0 ? (
                  <>
                    {order.order_lines.map((line) => {
                      const substitutes = getSubstitutesForLine(line.line_id);
                      const usedSubstitute = getUsedSubstitute(line.line_id);
                      const isReplaced = isLineReplaced(line);
                      const productName = line.product?.product_name || 'Unknown Product';
                      const unitPrice = line.product?.price || 0;
                      const lineTotal = unitPrice * line.ordered_qty;

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
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Quantity</p>
                                  <p className="font-medium">{line.ordered_qty}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Unit Price</p>
                                  <p className="font-medium">€{unitPrice.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Line Total</p>
                              <p className="text-xl font-bold">€{lineTotal.toFixed(2)}</p>
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
                                        <div key={sub.substitute_id} className="text-sm">
                                          <span className="font-medium text-purple-700">
                                            Priority {sub.priority}:
                                          </span>{' '}
                                          <span className="text-purple-600">
                                            {sub.substitute_product?.product_name || sub.substitute_product_code}
                                          </span>
                                          {sub.substitute_product?.price && (
                                            <span className="text-purple-500 ml-2">
                                              (€{sub.substitute_product.price.toFixed(2)})
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Customer Comments */}
                          {line.customer_comments && (
                            <div className="text-sm">
                              <p className="text-muted-foreground">Your Note:</p>
                              <p className="mt-1 italic">{line.customer_comments}</p>
                            </div>
                          )}

                          {/* Delivery Status */}
                          {line.delivered_qty !== line.ordered_qty && (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              <span className="text-muted-foreground">
                                Delivered: {line.delivered_qty} of {line.ordered_qty}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Order Total */}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Order Total</span>
                        <span className="text-2xl font-bold">€{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState 
                    title="No items in this order" 
                    description="This order doesn't contain any items." 
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tracking History */}
          {order.tracking_history && order.tracking_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Tracking</CardTitle>
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
                  <Package className="h-5 w-5" />
                  Order Support
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <ChatWidget
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  placeholder="Ask a question about this order..."
                  className="h-full"
                  customerName={customerName}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

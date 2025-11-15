import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerOrdersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusChip } from '@/components/StatusChip';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function OrdersList() {
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const { data: orders } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => customerOrdersApi.getOrders({ status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <Button onClick={() => navigate('/customer/orders/new')}>New Order</Button>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="placed">Placed</SelectItem>
            <SelectItem value="under_risk">Under Risk</SelectItem>
            <SelectItem value="waiting_for_customer_action">Needs Action</SelectItem>
            <SelectItem value="picking">Picking</SelectItem>
            <SelectItem value="delivering">Delivering</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {orders?.map((order: any) => (
          <Card key={order.order_id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{order.order_id}</h3>
                  <StatusChip type="order" status={order.status} />
                  {order.overall_order_risk !== null && order.overall_order_risk !== undefined && (
                    <Badge variant="destructive">{(order.overall_order_risk * 100).toFixed(0)}%</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Delivery: {format(new Date(order.delivery_date), 'PPP')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Placed: {format(new Date(order.order_datetime), 'PPP p')}
                </p>
                {order.status === 'waiting_for_customer_action' && (
                  <Badge variant="outline" className="text-warning">
                    Action Required
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate(`/customer/orders/${order.order_id}`)}>
                  View Details
                </Button>
                {order.status === 'waiting_for_customer_action' && (
                  <Button variant="default" onClick={() => navigate(`/customer/orders/${order.order_id}`)}>
                    Respond
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {orders && orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No orders found</p>
            <Button onClick={() => navigate('/customer/orders/new')} className="mt-4">
              Place Your First Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

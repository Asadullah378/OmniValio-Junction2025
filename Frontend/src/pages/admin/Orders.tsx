import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusChip } from '@/components/StatusChip';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { adminOrdersApi } from '@/lib/api';
import { OrderStatus } from '@/lib/types';

interface OrderListItem {
  order_id: string;
  customer_id: string;
  delivery_date: string;
  status: OrderStatus;
  overall_order_risk?: number | null;
  order_datetime: string;
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      return adminOrdersApi.getOrders(params);
    },
  });

  const filteredOrders = (orders || []).filter((order: OrderListItem) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const needsActionCount = (orders || []).filter(
    (o: OrderListItem) => o.status === 'under_risk' || o.status === 'waiting_for_customer_action'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all customer orders
          </p>
        </div>
        {needsActionCount > 0 && (
          <div className="px-4 py-2 rounded-lg bg-warning/10 text-warning border border-warning/20">
            {needsActionCount} orders require attention
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>View and manage customer orders</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="placed">Placed</SelectItem>
                  <SelectItem value="under_risk">Under Risk</SelectItem>
                  <SelectItem value="waiting_for_customer_action">Waiting</SelectItem>
                  <SelectItem value="picking">Picking</SelectItem>
                  <SelectItem value="delivering">Delivering</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner className="h-32" text="Loading orders..." />
          ) : error ? (
            <ErrorDisplay message="Failed to load orders" onRetry={() => refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        title="No orders found"
                        description={searchQuery || statusFilter !== 'all' 
                          ? "Try adjusting your filters to see more results."
                          : "No orders have been placed yet."}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order: OrderListItem) => (
                    <TableRow
                      key={order.order_id}
                      className={
                        order.status === 'under_risk' || order.status === 'waiting_for_customer_action'
                          ? 'bg-warning/5'
                          : ''
                      }
                    >
                      <TableCell className="font-medium">{order.order_id}</TableCell>
                      <TableCell>{order.customer_id}</TableCell>
                      <TableCell>{new Date(order.delivery_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <StatusChip type="order" status={order.status} />
                      </TableCell>
                      <TableCell>
                        {order.overall_order_risk !== null && order.overall_order_risk !== undefined ? (
                          <span className="text-sm text-muted-foreground">{(order.overall_order_risk * 100).toFixed(0)}%</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.order_datetime).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/orders/${order.order_id}`}>
                          <Button variant="ghost" size="sm">
                            View & Edit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

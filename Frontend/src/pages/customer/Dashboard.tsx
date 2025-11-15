import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Package, TrendingUp, Truck, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { customerDashboardApi } from '@/lib/api';
import { CustomerDashboard as DashboardType, OrderSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function CustomerDashboard() {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [actionsNeeded, setActionsNeeded] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [dashboardData, actionsData] = await Promise.all([
        customerDashboardApi.getDashboard(),
        customerDashboardApi.getActionsNeeded(),
      ]);
      setDashboard(dashboardData);
      setActionsNeeded(actionsData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="h-64" text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadDashboard} />;
  }

  if (!dashboard) {
    return <EmptyState title="No data available" description="Unable to load dashboard information." />;
  }

  const stats = [
    {
      label: 'Total Orders',
      value: dashboard.stats.total_orders,
      icon: Package,
      color: 'text-primary',
    },
    {
      label: 'Orders at Risk',
      value: dashboard.stats.orders_at_risk,
      icon: AlertCircle,
      color: 'text-warning',
    },
    {
      label: 'In Picking',
      value: dashboard.stats.orders_in_picking,
      icon: TrendingUp,
      color: 'text-info',
    },
    {
      label: 'Delivered Today',
      value: dashboard.stats.orders_delivered_today,
      icon: CheckCircle,
      color: 'text-success',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Good morning, {dashboard.customer.name}</CardTitle>
          <CardDescription>Here's what's happening with your orders today</CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Needed */}
      {actionsNeeded.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Actions Needed
            </CardTitle>
            <CardDescription>
              These orders require your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionsNeeded.map((order) => (
                <div
                  key={order.order_id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="space-y-1">
                    <p className="font-medium">Order {order.order_id}</p>
                    <p className="text-sm text-muted-foreground">
                      Waiting for your confirmation
                    </p>
                  </div>
                  <Link to={`/customer/orders/${order.order_id}`}>
                    <Button variant="default">
                      Open Order & Chat
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders in Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders in Progress</CardTitle>
              <CardDescription>Recent orders and their status</CardDescription>
            </div>
            <Link to="/customer/orders">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.recent_orders.filter((o) => o.status !== 'delivered').map((order) => (
              <div
                key={order.order_id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{order.order_id}</p>
                    <StatusChip type="order" status={order.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </div>
                    {order.overall_order_risk !== null && order.overall_order_risk !== undefined && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Risk: {(order.overall_order_risk * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
                <Link to={`/customer/orders/${order.order_id}`}>
                  <Button variant="ghost">View Details</Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Open Claims */}
      {dashboard.open_claims.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Open Claims</CardTitle>
                <CardDescription>Claims currently being processed</CardDescription>
              </div>
              <Link to="/customer/claims">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.open_claims.map((claim) => (
                <div
                  key={claim.claim_id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{claim.claim_id}</p>
                      <StatusChip type="claim" status={claim.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Order: {claim.order_id} • Type: {claim.claim_type.replace('_', ' ')}
                    </p>
                  </div>
                  <Link to={`/customer/claims/${claim.claim_id}`}>
                    <Button variant="ghost">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

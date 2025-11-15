import { useQuery } from '@tanstack/react-query';
import { customerDashboardApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function Alerts() {
  const navigate = useNavigate();

  const { data: actionsNeeded } = useQuery({
    queryKey: ['actions-needed'],
    queryFn: () => customerDashboardApi.getActionsNeeded(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Alerts & Actions Needed</h1>

      <div className="grid gap-4">
        {actionsNeeded?.map((order: any) => (
          <Card key={order.order_id} className="border-l-4 border-l-warning">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <CardTitle className="text-lg">Order {order.order_id}</CardTitle>
                  <StatusChip type="order" status={order.status} />
                </div>
                <Button onClick={() => navigate(`/customer/orders/${order.order_id}`)}>
                  Open Order & Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This order requires your attention. Please review and respond.
              </p>
              {order.overall_order_risk !== null && order.overall_order_risk !== undefined && (
                <p className="text-sm text-destructive mt-2">
                  Risk Level: {(order.overall_order_risk * 100).toFixed(0)}%
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {actionsNeeded && actionsNeeded.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No actions needed at this time</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

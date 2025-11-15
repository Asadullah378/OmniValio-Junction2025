import { useQuery } from '@tanstack/react-query';
import { customerOrdersApi, customerClaimsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';

export default function Communication() {
  const navigate = useNavigate();

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => customerOrdersApi.getOrders({}),
  });

  const { data: claims } = useQuery({
    queryKey: ['claims'],
    queryFn: () => customerClaimsApi.getClaims(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Communication Hub</h1>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Order Messages</TabsTrigger>
          <TabsTrigger value="claims">Claim Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4 mt-6">
          {orders?.map((order: any) => (
            <Card key={order.order_id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Order {order.order_id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {format(new Date(order.order_datetime), 'PPP')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/customer/orders/${order.order_id}`)}>
                    View Chat
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}

          {orders && orders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No order conversations yet
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-4 mt-6">
          {claims?.map((claim: any) => (
            <Card key={claim.claim_id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Claim {claim.claim_id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Order: {claim.order_id}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/customer/claims/${claim.claim_id}`)}>
                    View Chat
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}

          {claims && claims.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No claim conversations yet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

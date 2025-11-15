import { useQuery } from '@tanstack/react-query';
import { customerDashboardApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => customerDashboardApi.getDashboard(),
  });

  const customer = dashboard?.customer;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer ID</p>
              <p className="font-medium">{customer?.customer_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Segment</p>
              <Badge>{customer?.segment}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{customer?.location || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Language</p>
              <p className="font-medium">{customer?.language_preference?.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Channel</p>
              <p className="font-medium">{customer?.contact_channel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No Call Before</p>
              <p className="font-medium">{customer?.no_call_before}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auto-Substitutions</p>
              <Badge variant={customer?.accept_auto_substitutions_for_flexible_items ? 'default' : 'secondary'}>
                {customer?.accept_auto_substitutions_for_flexible_items ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        To update your settings, please contact your account manager.
      </p>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { adminCustomersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CustomersList() {
  const navigate = useNavigate();
  const { data: customers, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => adminCustomersApi.getCustomers(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage customer accounts and information</p>
        </div>
        <Button onClick={() => navigate('/admin/customers/new')}>Create Customer</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>{customers?.length || 0} total customers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner className="h-32" text="Loading customers..." />
          ) : error ? (
            <ErrorDisplay message="Failed to load customers" onRetry={() => refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Contact Channel</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!customers || customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        title="No customers found"
                        description="Create your first customer to get started."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer: any) => (
                    <TableRow key={customer.customer_id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">{customer.customer_id}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>
                        {customer.segment ? (
                          <Badge>{customer.segment}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{customer.language_preference?.toUpperCase() || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.contact_channel || '—'}</Badge>
                      </TableCell>
                      <TableCell>{customer.location || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => navigate(`/admin/customers/${customer.customer_id}`)}>
                          View
                        </Button>
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

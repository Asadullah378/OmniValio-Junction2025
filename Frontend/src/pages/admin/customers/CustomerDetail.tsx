import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminCustomersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useToast } from '@/hooks/use-toast';
import { createCustomerUserSchema, type CreateCustomerUserFormData } from '@/lib/validations';

export default function CustomerDetail() {
  const { customerId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateCustomerUserFormData>({
    resolver: zodResolver(createCustomerUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const { data: customer, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-customer', customerId],
    queryFn: () => adminCustomersApi.getCustomer(customerId!),
    enabled: !!customerId,
    retry: 1,
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateCustomerUserFormData) => adminCustomersApi.createCustomerUser(customerId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer', customerId] });
      toast({ title: 'User created successfully' });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateCustomerUserFormData) => {
    createUserMutation.mutate(data);
  };

  if (isLoading) {
    return <LoadingSpinner className="h-64" text="Loading customer details..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : 'Failed to load customer'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!customer) {
    return <ErrorDisplay message="Customer not found" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{customer.name}</h1>

      <Card>
        <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">Customer ID</p><p className="font-medium">{customer.customer_id}</p></div>
            <div><p className="text-sm text-muted-foreground">Segment</p><Badge>{customer.segment}</Badge></div>
            <div><p className="text-sm text-muted-foreground">Language</p><p className="font-medium">{customer.language_preference?.toUpperCase()}</p></div>
            <div><p className="text-sm text-muted-foreground">Contact Channel</p><p className="font-medium">{customer.contact_channel}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Create User Login</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createUserMutation.isPending || form.formState.isSubmitting}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

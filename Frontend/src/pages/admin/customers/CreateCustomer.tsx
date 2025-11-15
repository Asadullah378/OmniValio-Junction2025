import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminCustomersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { createCustomerSchema, type CreateCustomerFormData } from '@/lib/validations';

export default function CreateCustomer() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      customer_id: '',
      name: '',
      segment: null,
      language_preference: 'fi',
      contact_channel: 'voice_first',
      no_call_before: '07:00',
      accept_auto_substitutions_for_flexible_items: true,
      location: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerFormData) => adminCustomersApi.createCustomer(data),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });
      navigate(`/admin/customers/${data.customer_id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create customer',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateCustomerFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/customers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Create New Customer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer ID *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="segment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select segment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fi">Finnish</SelectItem>
                          <SelectItem value="sv">Swedish</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Channel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="voice_first">Voice First</SelectItem>
                          <SelectItem value="sms_first">SMS First</SelectItem>
                          <SelectItem value="email_only">Email Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="no_call_before"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No Call Before</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Region" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accept_auto_substitutions_for_flexible_items"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 col-span-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Accept Auto-Substitutions for Flexible Items</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending || form.formState.isSubmitting}>
                  {createMutation.isPending ? 'Creating...' : 'Create Customer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/customers')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import { loginSchema, type LoginFormData } from '@/lib/validations';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.username, data.password);
      const userData = await authApi.getCurrentUser();
      
      // Route based on role
      if (userData.role === 'customer') {
        navigate('/customer/dashboard');
      } else if (userData.role === 'admin') {
        navigate('/admin/orders');
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.detail || 'Invalid username or password',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold">Omni-Valio</h1>
          </div>
          <p className="text-muted-foreground text-center">
            Zero-Fail Logistics Customer Portal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
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
                        <Input
                          placeholder="Enter your username"
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
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
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCredentialsDialog(true)}
                  disabled={form.formState.isSubmitting}
                >
                  <Info className="h-4 w-4 mr-2" />
                  Get Credentials for Test
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Valio Aimo Customer Portal v2.0.0
        </p>
      </div>

      {/* Test Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Test Credentials</DialogTitle>
            <DialogDescription>
              Use these credentials to test the application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Customer Credentials */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Customer Account</h3>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Customer Portal</span>
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium text-muted-foreground">Username:</Label>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">unicafe</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium text-muted-foreground">Password:</Label>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">customer123</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Access: Dashboard, Orders, Claims, Invoices, Alerts
                </p>
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Admin Account</h3>
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">Admin Portal</span>
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-purple-200">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium text-muted-foreground">Username:</Label>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">admin</code>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium text-muted-foreground">Password:</Label>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">admin123</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Access: Order Management, Inventory, Products, Claims, Customers
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Live URL:</strong>{' '}
                <a 
                  href="https://omnivalio.live" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://omnivalio.live
                </a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

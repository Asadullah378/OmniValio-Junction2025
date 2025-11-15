import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import { loginSchema, type LoginFormData } from '@/lib/validations';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Valio Aimo Customer Portal v2.0.0
        </p>
      </div>
    </div>
  );
}

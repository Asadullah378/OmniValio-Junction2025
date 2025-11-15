import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function Profile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner className="h-64" text="Loading profile..." />;
  }

  if (!user) {
    return <ErrorDisplay message="Unable to load user information" />;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your personal account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-medium">{user.user_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge className="mt-1 capitalize">{user.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Username
              </p>
              <p className="font-medium">{user.username}</p>
            </div>
            {user.customer_id && (
              <div>
                <p className="text-sm text-muted-foreground">Customer ID</p>
                <p className="font-medium">{user.customer_id}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {user.role === 'customer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {user.created_at && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {new Date(user.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


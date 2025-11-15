import { ReactNode } from 'react';
import { Package, FileText, ShoppingCart, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons = {
  orders: <ShoppingCart className="h-12 w-12 text-muted-foreground" />,
  products: <Package className="h-12 w-12 text-muted-foreground" />,
  claims: <FileText className="h-12 w-12 text-muted-foreground" />,
  alerts: <AlertCircle className="h-12 w-12 text-muted-foreground" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4">
          {icon || defaultIcons.orders}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


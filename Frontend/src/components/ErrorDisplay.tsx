import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ title = 'Error', message, onRetry, className }: ErrorDisplayProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}


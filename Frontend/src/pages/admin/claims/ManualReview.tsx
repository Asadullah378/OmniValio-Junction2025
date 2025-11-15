import { useQuery } from '@tanstack/react-query';
import { adminClaimsApi, adminCustomersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { format } from 'date-fns';
import { AlertCircle, Bot, Sparkles } from 'lucide-react';

export default function ManualReview() {
  const navigate = useNavigate();
  const { data: claims, isLoading, error, refetch } = useQuery({
    queryKey: ['manual-review-claims'],
    queryFn: () => adminClaimsApi.getManualReviewClaims(),
  });

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? format(date, 'PPP p') : 'Invalid date';
  };

  const formatClaimType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manual Review Queue</h1>
        <p className="text-muted-foreground">
          Claims requiring manual review by administrators
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner className="h-64" text="Loading claims for review..." />
      ) : error ? (
        <ErrorDisplay message="Failed to load claims" onRetry={() => refetch()} />
      ) : !claims || claims.length === 0 ? (
        <EmptyState
          title="No claims require review"
          description="All claims have been processed or are awaiting AI processing."
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim: any) => (
            <Card key={claim.claim_id} className="p-6 hover:shadow-lg transition-shadow border-orange-200 bg-orange-50/30">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">Claim</h3>
                    <StatusChip type="claim" status={claim.status} />
                    <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                      <AlertCircle className="h-3 w-3" />
                      Manual Review Required
                    </Badge>
                    {claim.processing?.ai_processed && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Processed
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-medium">{formatDate(claim.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Claim Type</p>
                      <Badge variant="outline" className="mt-1">{formatClaimType(claim.claim_type)}</Badge>
                    </div>
                    {claim.processing?.ai_confidence !== null && claim.processing?.ai_confidence !== undefined && (
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          AI Confidence
                        </p>
                        <p className="font-medium text-purple-600">{(claim.processing.ai_confidence * 100).toFixed(0)}%</p>
                      </div>
                    )}
                  </div>
                  {claim.processing?.ai_result && (
                    <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900 mb-1">AI Analysis:</p>
                          <p className="text-sm text-purple-800">{claim.processing.ai_result}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => navigate(`/admin/claims/${claim.claim_id}`)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Review Claim
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

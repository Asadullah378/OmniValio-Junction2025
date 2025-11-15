import { useQuery } from '@tanstack/react-query';
import { adminClaimsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { format } from 'date-fns';
import { AlertCircle, Bot, Sparkles } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminClaimsList() {
  const navigate = useNavigate();
  const { data: claims, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-claims'],
    queryFn: () => adminClaimsApi.getClaims({}),
  });

  const { data: manualReviewClaims } = useQuery({
    queryKey: ['manual-review-claims'],
    queryFn: () => adminClaimsApi.getManualReviewClaims(),
  });

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? format(date, 'PPP') : 'Invalid date';
  };

  const formatClaimType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const manualReviewCount = manualReviewClaims?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Claims Management</h1>
          <p className="text-muted-foreground">View and manage all customer claims</p>
        </div>
        <Button 
          onClick={() => navigate('/admin/claims/manual-review')}
          variant={manualReviewCount > 0 ? 'default' : 'outline'}
          className={manualReviewCount > 0 ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          {manualReviewCount > 0 && (
            <AlertCircle className="h-4 w-4 mr-2" />
          )}
          Manual Review Queue
          {manualReviewCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {manualReviewCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Manual Review Alert */}
      {manualReviewCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">
                    {manualReviewCount} {manualReviewCount === 1 ? 'claim requires' : 'claims require'} manual review
                  </p>
                  <p className="text-sm text-orange-700">
                    AI has flagged these claims for your attention
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/admin/claims/manual-review')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Claims</CardTitle>
          <CardDescription>{claims?.length || 0} total claims</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner className="h-32" text="Loading claims..." />
          ) : error ? (
            <ErrorDisplay message="Failed to load claims" onRetry={() => refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Analysis</TableHead>
                  <TableHead>Review Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!claims || claims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        title="No claims found"
                        description="No claims have been submitted yet."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  claims.map((claim: any) => (
                    <TableRow 
                      key={claim.claim_id} 
                      className={`hover:bg-accent/50 ${claim.processing?.requires_manual_review ? 'bg-orange-50/50' : ''}`}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{formatDate(claim.created_at)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatClaimType(claim.claim_type)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatClaimType(claim.claim_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusChip type="claim" status={claim.status} />
                      </TableCell>
                      <TableCell>
                        {claim.processing?.ai_processed ? (
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-purple-600" />
                            <span className="text-sm">
                              {claim.processing?.ai_confidence !== null && claim.processing?.ai_confidence !== undefined
                                ? `${(claim.processing.ai_confidence * 100).toFixed(0)}%`
                                : 'Processed'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Processing...</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {claim.processing?.requires_manual_review ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" />
                            Manual Review
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">
                            Auto Processed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => navigate(`/admin/claims/${claim.claim_id}`)}>
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

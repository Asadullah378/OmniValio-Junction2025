import { useQuery } from '@tanstack/react-query';
import { customerClaimsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusChip } from '@/components/StatusChip';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Bot, Sparkles } from 'lucide-react';

export default function ClaimsList() {
  const navigate = useNavigate();

  const { data: claims } = useQuery({
    queryKey: ['claims'],
    queryFn: () => customerClaimsApi.getClaims(),
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Claims</h1>
        <Button onClick={() => navigate('/customer/claims/new')}>Create New Claim</Button>
      </div>

      <div className="space-y-4">
        {claims && claims.length > 0 ? (
          claims.map((claim: any) => (
            <Card key={claim.claim_id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">Claim</h3>
                    <StatusChip type="claim" status={claim.status} />
                    {claim.processing?.requires_manual_review && (
                      <Badge variant="destructive">Manual Review</Badge>
                    )}
                    {claim.processing?.ai_processed && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Processed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {formatDate(claim.created_at)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Type: {formatClaimType(claim.claim_type)}
                  </p>
                  {claim.processing?.ai_confidence !== null && claim.processing?.ai_confidence !== undefined && (
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-700">
                        AI Confidence: {(claim.processing.ai_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {claim.resolution_type && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="default">{claim.resolution_type}</Badge>
                      {claim.credit_amount && (
                        <Badge variant="secondary">
                          Credit: €{claim.credit_amount.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button onClick={() => navigate(`/customer/claims/${claim.claim_id}`)}>
                  View Details
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12 text-muted-foreground">
              <p>No claims yet</p>
              <Button 
                onClick={() => navigate('/customer/claims/new')} 
                className="mt-4"
              >
                Create Your First Claim
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

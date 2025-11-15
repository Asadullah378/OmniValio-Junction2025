import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminClaimsApi, adminCustomersApi, adminOrdersApi, API_BASE_URL } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { ChatWidget } from '@/components/ChatWidget';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  FileText, 
  Package, 
  Image as ImageIcon, 
  Video, 
  Bot, 
  CheckCircle,
  CreditCard,
  Truck,
  MessageSquare,
  AlertCircle,
  Clock,
  User,
  Sparkles,
  XCircle,
  Calendar
} from 'lucide-react';
import { ClaimWithDetails, ClaimType, ResolutionType } from '@/lib/types';

function formatClaimType(type: ClaimType): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function formatResolutionType(type: ResolutionType): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export default function AdminClaimDetail() {
  const { claimId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refundAmount, setRefundAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data: claim, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-claim', claimId],
    queryFn: () => adminClaimsApi.getClaim(claimId!),
    enabled: !!claimId,
  });

  // Fetch customer information
  const { data: customer } = useQuery({
    queryKey: ['customer', claim?.customer_id],
    queryFn: () => adminCustomersApi.getCustomer(claim!.customer_id),
    enabled: !!claim?.customer_id,
  });

  // Fetch order information
  const { data: order } = useQuery({
    queryKey: ['admin-order', claim?.order_id],
    queryFn: () => adminOrdersApi.getOrder(claim!.order_id),
    enabled: !!claim?.order_id,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-claim-messages', claimId],
    queryFn: () => adminClaimsApi.getClaimMessages(claimId!),
    enabled: !!claimId,
  });

  const approveMutation = useMutation({
    mutationFn: (amount?: number) => adminClaimsApi.approveClaim(claimId!, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] });
      queryClient.invalidateQueries({ queryKey: ['manual-review-claims'] });
      toast({ title: 'Claim approved successfully' });
      setRefundAmount('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to approve claim',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => adminClaimsApi.rejectClaim(claimId!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] });
      queryClient.invalidateQueries({ queryKey: ['manual-review-claims'] });
      toast({ title: 'Claim rejected' });
      setRejectReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to reject claim',
        variant: 'destructive',
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => adminClaimsApi.sendClaimMessage(claimId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claim-messages', claimId] });
      queryClient.invalidateQueries({ queryKey: ['admin-claim', claimId] });
    },
  });

  const handleSendMessage = async (content: string) => {
    await sendMessageMutation.mutateAsync(content);
  };

  const handleApprove = () => {
    const amount = refundAmount ? parseFloat(refundAmount) : undefined;
    if (amount !== undefined && (isNaN(amount) || amount < 0)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid refund amount',
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate(amount);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }
    rejectMutation.mutate(rejectReason);
  };

  // Format date safely
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? format(date, 'PPP p') : 'Invalid date';
  };

  // Parse AI result
  const parseAIResult = (aiResult: string | null | undefined): { summary: string; decision: string } | null => {
    if (!aiResult) return null;
    
    try {
      const parsed = JSON.parse(aiResult);
      return {
        summary: parsed.summary || parsed.ai_summary || aiResult,
        decision: parsed.decision || parsed.result || 'Pending Review'
      };
    } catch {
      return {
        summary: aiResult,
        decision: 'Pending Review'
      };
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="h-64" text="Loading claim details..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error instanceof Error ? error.message : 'Failed to load claim'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!claim) {
    return <EmptyState message="Claim not found" />;
  }

  const claimData = claim as ClaimWithDetails;
  const aiResultParsed = parseAIResult(claimData.processing?.ai_result);
  const needsManualReview = claimData.processing?.requires_manual_review;
  const canTakeAction = claimData.status === 'ai_processing' || claimData.status === 'manual_review' || needsManualReview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Claim Details</h1>
          <p className="text-muted-foreground mt-1">
            Submitted on {formatDate(claimData.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip type="claim" status={claimData.status} />
          {needsManualReview && (
            <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              Manual Review Required
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Claim Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Customer
                  </p>
                  <p className="font-medium">{customer?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Related Order
                  </p>
                  <p className="font-medium">
                    {order ? `Order from ${formatDate(order.order_datetime)}` : 'Loading...'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Claim Type</p>
                  <Badge variant="outline" className="mt-1">{formatClaimType(claimData.claim_type)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Submitted
                  </p>
                  <p className="font-medium">{formatDate(claimData.created_at)}</p>
                </div>
                {claimData.updated_at !== claimData.created_at && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Updated
                    </p>
                    <p className="font-medium">{formatDate(claimData.updated_at)}</p>
                  </div>
                )}
                {claimData.handled_by && (
                  <div>
                    <p className="text-sm text-muted-foreground">Handled By</p>
                    <p className="font-medium">{claimData.handled_by}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reported Issues */}
          {claimData.claim_lines && claimData.claim_lines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Reported Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claimData.claim_lines.map((line) => (
                    <div key={line.claim_line_id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        {line.product_code ? (
                          <Badge variant="outline">Product Issue</Badge>
                        ) : (
                          <Badge variant="secondary">General Issue</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(line.created_at)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Description:</p>
                        <p className="text-sm">{line.reported_issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {claimData.claim_attachments && claimData.claim_attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Evidence ({claimData.claim_attachments.length} {claimData.claim_attachments.length === 1 ? 'image' : 'images'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {claimData.claim_attachments.map((attachment) => {
                    const fileName = attachment.file_path.split('/').pop() || attachment.file_path;
                    const isImage = attachment.file_type === 'IMAGE';
                    
                    // Construct file URL - try different path formats
                    let fileUrl = '';
                    if (attachment.file_path.startsWith('http://') || attachment.file_path.startsWith('https://')) {
                      // Full URL provided
                      fileUrl = attachment.file_path;
                    } else if (attachment.file_path.startsWith('/')) {
                      // Absolute path from backend root
                      fileUrl = `${API_BASE_URL}${attachment.file_path}`;
                    } else {
                      // Relative path - check if it already contains uploads
                      if (attachment.file_path.includes('uploads/') || attachment.file_path.startsWith('uploads/')) {
                        // Already has uploads in path, use files/uploads
                        const cleanPath = attachment.file_path.replace(/^uploads\//, '').replace(/^\/uploads\//, '');
                        fileUrl = `${API_BASE_URL}/files/uploads/${cleanPath}`;
                      } else {
                        // No uploads in path, add it
                        fileUrl = `${API_BASE_URL}/files/uploads/${attachment.file_path}`;
                      }
                    }
                    
                    return (
                      <div key={attachment.attachment_id} className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
                        {isImage ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                            <img
                              src={fileUrl}
                              alt={fileName}
                              className="w-full h-32 object-cover hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // Try alternative paths if first attempt fails
                                const cleanPath = attachment.file_path.replace(/^uploads\//, '').replace(/^\/uploads\//, '');
                                const altPaths = [
                                  `${API_BASE_URL}/files/uploads/${cleanPath}`,
                                  `${API_BASE_URL}/uploads/${attachment.file_path}`,
                                  `${API_BASE_URL}/static/${attachment.file_path}`,
                                  `${API_BASE_URL}${attachment.file_path}`,
                                ];
                                
                                let attemptIndex = 0;
                                const tryNextPath = () => {
                                  if (attemptIndex < altPaths.length) {
                                    target.src = altPaths[attemptIndex];
                                    attemptIndex++;
                                  } else {
                                    // All paths failed - show placeholder
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const placeholder = document.createElement('div');
                                      placeholder.className = 'h-32 bg-muted flex items-center justify-center';
                                      placeholder.innerHTML = '<p class="text-xs text-muted-foreground">Image not available</p>';
                                      parent.appendChild(placeholder);
                                    }
                                  }
                                };
                                
                                target.onerror = tryNextPath;
                                tryNextPath();
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Click to view full size</span>
                            </div>
                          </a>
                        ) : (
                          <div className="h-32 bg-muted flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-medium truncate" title={fileName}>
                            {fileName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Processing Information */}
          {claimData.processing && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="relative">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <Sparkles className="h-3 w-3 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    AI-Powered Analysis
                  </span>
                </CardTitle>
                <CardDescription>
                  AI has analyzed this claim and provided recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Processing Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {claimData.processing.ai_processed ? (
                        <Badge variant="default" className="flex items-center gap-1 bg-purple-600">
                          <CheckCircle className="h-3 w-3" />
                          Processed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Processing...
                        </Badge>
                      )}
                    </div>
                  </div>
                  {claimData.processing.ai_confidence !== null && claimData.processing.ai_confidence !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">AI Confidence</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-purple-600">{(claimData.processing.ai_confidence * 100).toFixed(1)}%</p>
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      </div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Review Status</p>
                    <Badge variant={needsManualReview ? 'destructive' : 'default'} className="mt-1">
                      {needsManualReview ? 'Requires Manual Review' : 'Automatically Processed'}
                    </Badge>
                  </div>
                </div>
                
                {aiResultParsed && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900 mb-2">AI Analysis Summary</p>
                        <p className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-100">
                          {aiResultParsed.summary}
                        </p>
                        {aiResultParsed.decision && aiResultParsed.decision !== 'Pending Review' && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-purple-700 mb-1">AI Recommendation:</p>
                            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                              {aiResultParsed.decision}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {claimData.processing.reviewed_by && (
                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Reviewed By</p>
                        <p className="font-medium">{claimData.processing.reviewed_by}</p>
                      </div>
                      {claimData.processing.reviewed_at && (
                        <div>
                          <p className="text-sm text-muted-foreground">Reviewed At</p>
                          <p className="font-medium">{formatDate(claimData.processing.reviewed_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resolution Information */}
          {(claimData.resolution_type || claimData.credit_amount || claimData.re_delivery_date || claimData.rejection_reason) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {claimData.status === 'rejected' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {claimData.status === 'rejected' ? 'Rejection' : 'Resolution'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {claimData.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-900 mb-2">Rejection Reason:</p>
                    <p className="text-sm text-red-800">{claimData.rejection_reason}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {claimData.resolution_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Resolution Type</p>
                      <Badge variant="default" className="mt-1">
                        {formatResolutionType(claimData.resolution_type)}
                      </Badge>
                    </div>
                  )}
                  {claimData.credit_amount !== null && claimData.credit_amount !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Credit Amount</p>
                      <p className="text-lg font-bold text-green-600 flex items-center gap-1 mt-1">
                        <CreditCard className="h-4 w-4" />
                        €{claimData.credit_amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {claimData.re_delivery_date && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Re-delivery Date</p>
                      <p className="font-medium flex items-center gap-1 mt-1">
                        <Truck className="h-4 w-4" />
                        {formatDate(claimData.re_delivery_date)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions */}
          {canTakeAction ? (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Action Required
                </CardTitle>
                <CardDescription>
                  {needsManualReview 
                    ? 'AI has flagged this claim for manual review. Please review and take action.'
                    : 'Please review this claim and take appropriate action.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Approve Section */}
                <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Approve Claim</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-900">Refund Amount (€)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="Optional - leave empty for auto-calculate"
                        className="bg-white"
                      />
                      <Button 
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approveMutation.isPending ? 'Approving...' : 'Approve Claim'}
                      </Button>
                    </div>
                    <p className="text-xs text-green-700">
                      Leave empty to automatically calculate refund based on order value
                    </p>
                  </div>
                </div>

                {/* Reject Section */}
                <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">Reject Claim</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-red-900">Rejection Reason *</label>
                    <div className="flex gap-2">
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter detailed reason for rejection..."
                        rows={4}
                        className="flex-1 bg-white"
                      />
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || rejectMutation.isPending}
                      >
                        {rejectMutation.isPending ? 'Rejecting...' : 'Reject Claim'}
                      </Button>
                    </div>
                    <p className="text-xs text-red-700">
                      A detailed reason is required when rejecting a claim
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Claim Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This claim has been {claimData.status === 'approved' ? 'approved' : claimData.status === 'rejected' ? 'rejected' : 'resolved'}.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="flex flex-col" style={{ height: '75vh' }}>
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Claim Communication
                </CardTitle>
                <CardDescription>Communicate with customer about this claim</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <ChatWidget
                  messages={messages || []}
                  onSendMessage={handleSendMessage}
                  placeholder="Type your message about this claim..."
                  className="h-full"
                  customerName={customer?.name}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

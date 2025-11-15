import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerClaimsApi, customerDashboardApi, API_BASE_URL } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { ChatWidget } from '@/components/ChatWidget';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { format } from 'date-fns';
import { 
  Calendar, 
  Package, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Bot, 
  CheckCircle,
  CreditCard,
  Truck,
  Clock,
  Sparkles,
  AlertCircle,
  MessageSquare,
  XCircle
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

export default function ClaimDetail() {
  const { claimId } = useParams();
  const queryClient = useQueryClient();

  const { data: claim, isLoading, error } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => customerClaimsApi.getClaim(claimId!),
    enabled: !!claimId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['claim-messages', claimId],
    queryFn: () => customerClaimsApi.getClaimMessages(claimId!),
    enabled: !!claimId,
  });

  // Fetch customer name for chat display
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => customerDashboardApi.getDashboard(),
  });
  const customerName = dashboard?.customer?.name;

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => customerClaimsApi.sendClaimMessage(claimId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-messages', claimId] });
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] });
    },
  });

  const handleSendMessage = async (content: string) => {
    await sendMessageMutation.mutateAsync(content);
  };

  // Format date safely
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? format(date, 'PPP p') : 'Invalid date';
  };

  // Parse AI result to extract summary and decision
  const parseAIResult = (aiResult: string | null | undefined): { summary: string; decision: string } | null => {
    if (!aiResult) return null;
    
    // Try to parse structured format (if backend provides it)
    try {
      const parsed = JSON.parse(aiResult);
      return {
        summary: parsed.summary || parsed.ai_summary || aiResult,
        decision: parsed.decision || parsed.result || 'Pending Review'
      };
    } catch {
      // If not JSON, treat entire string as summary
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
    return <ErrorDisplay message="Failed to load claim details" />;
  }

  if (!claim) {
    return <EmptyState message="Claim not found" />;
  }

  const claimData = claim as ClaimWithDetails;
  const aiResultParsed = parseAIResult(claimData.processing?.ai_result);
  const isAIProcessing = claimData.status === 'ai_processing';
  const needsManualReview = claimData.processing?.requires_manual_review;

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
            <Badge variant="destructive" className="flex items-center gap-1">
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
                    <Package className="h-3 w-3" />
                    Related Order
                  </p>
                  <p className="font-medium">Order from {formatDate(claimData.created_at)}</p>
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
                    AI-Powered Processing
                  </span>
                </CardTitle>
                <CardDescription>
                  Our AI system is analyzing your claim to provide the best resolution
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
        </div>

        {/* Sidebar - Chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="flex flex-col" style={{ height: '75vh' }}>
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Claim Support
                </CardTitle>
                <CardDescription>Chat with our support team about this claim</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <ChatWidget
                  messages={messages || []}
                  onSendMessage={handleSendMessage}
                  placeholder="Ask a question about this claim..."
                  className="h-full"
                  customerName={customerName}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

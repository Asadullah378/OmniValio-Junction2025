import { cn } from '@/lib/utils';
import { OrderStatus, ClaimStatus, InvoiceStatus } from '@/lib/types';

interface StatusChipProps {
  type: 'order' | 'claim' | 'invoice';
  status: OrderStatus | ClaimStatus | InvoiceStatus;
  className?: string;
}

const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  placed: { label: 'Placed', className: 'bg-status-placed text-white' },
  under_risk: { label: 'Under Risk', className: 'bg-status-under-risk text-white' },
  waiting_for_customer_action: { label: 'Waiting', className: 'bg-status-waiting text-white' },
  picking: { label: 'Picking', className: 'bg-status-picking text-white' },
  delivering: { label: 'Delivering', className: 'bg-status-delivering text-white' },
  delivered: { label: 'Delivered', className: 'bg-status-delivered text-white' },
  cancelled: { label: 'Cancelled', className: 'bg-status-cancelled text-white' },
};

const claimStatusConfig: Record<ClaimStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-claim-open text-white' },
  ai_processing: { label: 'AI Processing', className: 'bg-claim-processing text-white' },
  manual_review: { label: 'Manual Review', className: 'bg-claim-review text-white' },
  approved: { label: 'Approved', className: 'bg-claim-approved text-white' },
  rejected: { label: 'Rejected', className: 'bg-claim-rejected text-white' },
  resolved: { label: 'Resolved', className: 'bg-claim-resolved text-white' },
};

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning text-white' },
  paid: { label: 'Paid', className: 'bg-success text-white' },
  refunded: { label: 'Refunded', className: 'bg-info text-white' },
};

export function StatusChip({ type, status, className }: StatusChipProps) {
  let config;
  
  if (type === 'order') {
    config = orderStatusConfig[status as OrderStatus];
  } else if (type === 'claim') {
    config = claimStatusConfig[status as ClaimStatus];
  } else {
    config = invoiceStatusConfig[status as InvoiceStatus];
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

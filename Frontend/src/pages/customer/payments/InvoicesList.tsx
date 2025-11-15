import { useQuery } from '@tanstack/react-query';
import { customerPaymentsApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function InvoicesList() {
  const navigate = useNavigate();

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => customerPaymentsApi.getInvoices(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments & Invoices</h1>

      <div className="space-y-4">
        {invoices?.map((invoice: any) => (
          <Card key={invoice.invoice_id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{invoice.invoice_id}</h3>
                  <StatusChip type="invoice" status={invoice.status} />
                  <Badge variant="outline">{invoice.invoice_type}</Badge>
                </div>
                {invoice.order_id && (
                  <p className="text-sm text-muted-foreground">
                    Order: {invoice.order_id}
                  </p>
                )}
                {invoice.claim_id && (
                  <p className="text-sm text-muted-foreground">
                    Claim: {invoice.claim_id}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Created: {format(new Date(invoice.created_at), 'PPP')}
                </p>
                <p className="text-2xl font-bold">€{invoice.total_amount.toFixed(2)}</p>
              </div>
              <Button onClick={() => navigate(`/customer/payments/invoices/${invoice.invoice_id}`)}>
                View Invoice
              </Button>
            </div>
          </Card>
        ))}

        {invoices && invoices.length === 0 && (
          <Card>
            <div className="text-center py-12 text-muted-foreground">
              <p>No invoices yet</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

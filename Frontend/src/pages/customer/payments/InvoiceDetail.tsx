import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerPaymentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

export default function InvoiceDetail() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const { data: invoice } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => customerPaymentsApi.getInvoice(invoiceId!),
    enabled: !!invoiceId,
  });

  if (!invoice) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/customer/payments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{invoice.invoice_id}</h1>
        <StatusChip type="invoice" status={invoice.status} />
        <Badge variant="outline">{invoice.invoice_type}</Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {invoice.order_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Related Order</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/customer/orders/${invoice.order_id}`)}
                  >
                    {invoice.order_id}
                  </Button>
                </div>
              )}
              {invoice.claim_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Related Claim</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/customer/claims/${invoice.claim_id}`)}
                  >
                    {invoice.claim_id}
                  </Button>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(invoice.created_at), 'PPP p')}</p>
              </div>
              {invoice.paid_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="font-medium">{format(new Date(invoice.paid_at), 'PPP p')}</p>
                </div>
              )}
            </div>

            {invoice.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Quantity</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">€{item.unit_price.toFixed(2)}</td>
                      <td className="py-3 text-right">€{item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-4 space-y-2">
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>€{invoice.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>€{invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { LayoutDashboard, ShoppingCart, AlertCircle, FileText, CreditCard, MessageSquare, Settings } from 'lucide-react';
import { Layout } from '@/components/Layout';

const navItems = [
  { label: 'Dashboard', path: '/customer/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'New Order', path: '/customer/orders/new', icon: <ShoppingCart className="h-4 w-4" /> },
  { label: 'My Orders', path: '/customer/orders', icon: <FileText className="h-4 w-4" /> },
  { label: 'Alerts', path: '/customer/alerts', icon: <AlertCircle className="h-4 w-4" /> },
  { label: 'Claims', path: '/customer/claims', icon: <FileText className="h-4 w-4" /> },
  { label: 'Payments', path: '/customer/payments', icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Communication', path: '/customer/communication', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Settings', path: '/customer/settings', icon: <Settings className="h-4 w-4" /> },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <Layout navItems={navItems}>{children}</Layout>;
}

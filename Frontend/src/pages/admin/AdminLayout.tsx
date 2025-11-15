import { ReactNode } from 'react';
import { ShoppingCart, Package, Layers, FileText, Users } from 'lucide-react';
import { Layout } from '@/components/Layout';

const navItems = [
  { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart className="h-4 w-4" /> },
  { label: 'Inventory', path: '/admin/inventory', icon: <Package className="h-4 w-4" /> },
  { label: 'Products', path: '/admin/products', icon: <Layers className="h-4 w-4" /> },
  { label: 'Claims', path: '/admin/claims', icon: <FileText className="h-4 w-4" /> },
  { label: 'Customers', path: '/admin/customers', icon: <Users className="h-4 w-4" /> },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Layout navItems={navItems}>{children}</Layout>;
}

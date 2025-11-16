import { ReactNode, useEffect } from 'react';
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
  useEffect(() => {
    // Load ElevenLabs ConvAI widget script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
    if (!existingScript) {
      document.body.appendChild(script);
    }

    // Cleanup function
    return () => {
      // Don't remove the script on unmount as it might be used by the widget
      // The script will remain in the DOM for the session
    };
  }, []);

  return (
    <>
      <Layout navItems={navItems}>{children}</Layout>
      {/* ElevenLabs ConvAI Widget */}
      {/* @ts-ignore - Custom web component */}
      <elevenlabs-convai agent-id="agent_0801ka1yy0ycfrhbyn35ty2hpw03"></elevenlabs-convai>
    </>
  );
}

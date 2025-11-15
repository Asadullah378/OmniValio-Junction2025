import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

// Customer Pages
import CustomerLayout from "./pages/customer/CustomerLayout";
import CustomerDashboard from "./pages/customer/Dashboard";
import NewOrder from "./pages/customer/orders/NewOrder";
import OrdersList from "./pages/customer/orders/OrdersList";
import OrderDetail from "./pages/customer/orders/OrderDetail";
import Alerts from "./pages/customer/Alerts";
import ClaimsList from "./pages/customer/claims/ClaimsList";
import ClaimDetail from "./pages/customer/claims/ClaimDetail";
import CreateClaim from "./pages/customer/claims/CreateClaim";
import InvoicesList from "./pages/customer/payments/InvoicesList";
import InvoiceDetail from "./pages/customer/payments/InvoiceDetail";
import Communication from "./pages/customer/Communication";
import Settings from "./pages/customer/Settings";

// Admin Pages  
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/orders/OrderDetail";
import InventoryList from "./pages/admin/inventory/InventoryList";
import InventoryDetail from "./pages/admin/inventory/InventoryDetail";
import ProductsList from "./pages/admin/products/ProductsList";
import ProductForm from "./pages/admin/products/ProductForm";
import AdminClaimsList from "./pages/admin/claims/ClaimsList";
import AdminClaimDetail from "./pages/admin/claims/ClaimDetail";
import ManualReview from "./pages/admin/claims/ManualReview";
import CustomersList from "./pages/admin/customers/CustomersList";
import CustomerDetail from "./pages/admin/customers/CustomerDetail";
import CreateCustomer from "./pages/admin/customers/CreateCustomer";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'customer' | 'admin' }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'customer' ? '/customer/dashboard' : '/admin/orders'} replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Customer Routes */}
            <Route
              path="/customer/*"
              element={
                <ProtectedRoute role="customer">
                  <CustomerLayout>
                    <Routes>
                      <Route path="dashboard" element={<CustomerDashboard />} />
                      <Route path="orders/new" element={<NewOrder />} />
                      <Route path="orders/:orderId" element={<OrderDetail />} />
                      <Route path="orders" element={<OrdersList />} />
                      <Route path="alerts" element={<Alerts />} />
                      <Route path="claims/new" element={<CreateClaim />} />
                      <Route path="claims/:claimId" element={<ClaimDetail />} />
                      <Route path="claims" element={<ClaimsList />} />
                      <Route path="payments/invoices/:invoiceId" element={<InvoiceDetail />} />
                      <Route path="payments" element={<InvoicesList />} />
                      <Route path="communication" element={<Communication />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="*" element={<div className="text-center py-12 text-muted-foreground">Page coming soon...</div>} />
                    </Routes>
                  </CustomerLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute role="admin">
                  <AdminLayout>
                    <Routes>
                      <Route path="orders/:orderId" element={<AdminOrderDetail />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="inventory/:productCode" element={<InventoryDetail />} />
                      <Route path="inventory" element={<InventoryList />} />
                      <Route path="products/new" element={<ProductForm />} />
                      <Route path="products/:productCode/edit" element={<ProductForm />} />
                      <Route path="products" element={<ProductsList />} />
                      <Route path="claims/manual-review" element={<ManualReview />} />
                      <Route path="claims/:claimId" element={<AdminClaimDetail />} />
                      <Route path="claims" element={<AdminClaimsList />} />
                      <Route path="customers/new" element={<CreateCustomer />} />
                      <Route path="customers/:customerId" element={<CustomerDetail />} />
                      <Route path="customers" element={<CustomersList />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="*" element={<div className="text-center py-12 text-muted-foreground">Page coming soon...</div>} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

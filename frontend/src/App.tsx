import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AppErrorBoundary from './components/AppErrorBoundary';

import Home from './pages/Home';

// Lazy load secondary pages to optimize initial client bundle size
const Catalog = React.lazy(() => import('./pages/Catalog'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const OrderConfirmation = React.lazy(() => import('./pages/OrderConfirmation'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const BoutiqueDashboard = React.lazy(() => import('./pages/BoutiqueDashboard'));
const DesignerDashboard = React.lazy(() => import('./pages/DesignerDashboard'));
const BoutiqueStorefront = React.lazy(() => import('./pages/BoutiqueStorefront'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));

const AppContent: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/login');
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      
      {/* Side Shopping Bag Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Main Page Display */}
      <main className="flex-grow">
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh] font-sans text-xs uppercase tracking-widest text-luxury-gold">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-luxury-gold"></div>
              <span>Loading ABespoke...</span>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<AppErrorBoundary><Home /></AppErrorBoundary>} />
            <Route path="/catalog" element={<AppErrorBoundary><Catalog /></AppErrorBoundary>} />
            <Route path="/products/:id" element={<AppErrorBoundary><ProductDetails /></AppErrorBoundary>} />
            <Route path="/checkout" element={<AppErrorBoundary><Checkout /></AppErrorBoundary>} />
            <Route path="/order-confirmation" element={<AppErrorBoundary><OrderConfirmation /></AppErrorBoundary>} />
            <Route path="/dashboard" element={<AppErrorBoundary><UserDashboard /></AppErrorBoundary>} />
            <Route path="/admin" element={<AppErrorBoundary><AdminDashboard /></AppErrorBoundary>} />
            <Route path="/boutique" element={<AppErrorBoundary><BoutiqueDashboard /></AppErrorBoundary>} />
            <Route path="/designer" element={<AppErrorBoundary><DesignerDashboard /></AppErrorBoundary>} />
            <Route path="/boutique-store/:id" element={<AppErrorBoundary><BoutiqueStorefront /></AppErrorBoundary>} />
            <Route path="/login" element={<AppErrorBoundary><Login /></AppErrorBoundary>} />
            <Route path="/register" element={<AppErrorBoundary><Register /></AppErrorBoundary>} />
          </Routes>
        </React.Suspense>
      </main>

      {/* Footer Details */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

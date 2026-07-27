import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, ShoppingBag, ArrowRight } from 'lucide-react';
import { checkoutAPI } from '../services/api';

export const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const handleDownloadInvoice = () => {
    if (orderId) {
      const url = checkoutAPI.getInvoiceUrl(orderId);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-16 font-sans text-center space-y-8">
      {/* 1. Celebratory Success Icon */}
      <div className="flex justify-center">
        <div className="bg-green-50 p-4 rounded-full border border-green-200/50">
          <CheckCircle2 className="w-12 h-12 text-green-600 animate-bounce" />
        </div>
      </div>

      {/* 2. Success Headers */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-luxury-gold">Transaction Confirmed</span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-luxury-dark">Order Placed Successfully</h1>
        <p className="text-xs text-luxury-muted font-light max-w-sm mx-auto leading-relaxed">
          Thank you for shopping with ABespoke! Your order has been successfully registered.
        </p>
      </div>

      {/* 3. Order ID Card */}
      {orderId && (
        <div className="bg-white border border-neutral-100 rounded-xl p-5 space-y-4 shadow-sm text-xs">
          <div className="flex justify-between border-b border-neutral-100 pb-2 text-xs font-sans">
            <span className="text-luxury-muted">Order ID:</span>
            <span className="font-mono font-bold text-luxury-dark">{orderId}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-luxury-muted">Status:</span>
            <span className="bg-green-50 text-green-800 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px]">
              Placed
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-luxury-muted">Delivery Estimate:</span>
            <span className="font-semibold text-luxury-dark font-sans">3 - 4 Working Days</span>
          </div>
        </div>
      )}

      {/* 4. Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Invoice */}
        <button
          onClick={handleDownloadInvoice}
          disabled={!orderId}
          className="flex-1 bg-white hover:bg-neutral-50 text-luxury-dark border border-neutral-200 font-semibold text-[10px] uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-luxury-gold" /> Download Invoice
        </button>

        {/* View Orders */}
        <button
          onClick={() => navigate('/dashboard?tab=orders')}
          className="flex-1 bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Track Orders <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <button
          onClick={() => navigate('/')}
          className="text-[10px] font-bold text-luxury-gold hover:underline uppercase tracking-wider"
        >
          Back to Home
        </button>
      </div>

    </div>
  );
};
export default OrderConfirmation;

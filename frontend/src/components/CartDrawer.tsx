import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Tag, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    coupon,
    applyCoupon,
    removeCoupon,
    pricing
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const handleApplyCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    
    if (!couponCode.trim()) return;

    try {
      await applyCoupon(couponCode);
      setCouponSuccess(`Coupon "${couponCode.toUpperCase()}" applied successfully!`);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Failed to apply coupon');
    }
  };

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Drawer Panel */}
        <div className="w-screen max-w-md bg-[#FAF9F6] shadow-2xl flex flex-col h-full border-l border-neutral-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-white">
            <h2 className="text-sm font-sans font-bold text-luxury-dark uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-luxury-gold" /> Shopping Bag
            </h2>
            <button
              onClick={onClose}
              className="text-luxury-muted hover:text-luxury-dark transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
                <p className="text-sm font-semibold text-luxury-dark mb-1">Your bag is empty</p>
                <p className="text-xs text-luxury-muted font-light mb-6">Add premium styles to begin your shopping journey</p>
                <button
                  onClick={onClose}
                  className="bg-luxury-dark hover:bg-neutral-800 text-white font-sans text-[10px] uppercase tracking-widest font-semibold px-6 py-3 rounded-lg transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item, idx) => {
                const discountedUnitPrice = Math.round(item.product.price * (1 - item.product.discount / 100));
                return (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}-${idx}`}
                    className="flex gap-4 p-3 bg-white border border-neutral-100 rounded-xl relative shadow-sm"
                  >
                    {/* Item Image */}
                    <div className="w-20 h-24 bg-luxury-cream rounded overflow-hidden shrink-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-[9px] uppercase font-bold tracking-widest text-luxury-muted mb-0.5">
                          {item.product.brand}
                        </h4>
                        <h3 className="text-xs font-medium text-luxury-dark leading-tight line-clamp-1">
                          {item.product.title}
                        </h3>
                        <p className="text-[10px] text-luxury-muted mt-1">
                          Size: <span className="font-semibold text-luxury-dark">{item.size}</span> | Color: <span className="font-semibold text-luxury-dark">{item.color}</span>
                        </p>
                      </div>

                      {/* Quantity Controls & Price */}
                      <div className="flex justify-between items-center mt-2">
                        {/* Selector */}
                        <div className="flex items-center border border-neutral-200 rounded bg-[#FAF9F6] overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2 py-0.5 text-xs hover:bg-neutral-200 disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-semibold text-luxury-dark">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs hover:bg-neutral-200"
                          >
                            +
                          </button>
                        </div>

                        {/* Price Display */}
                        <div className="text-right">
                          <p className="text-xs font-bold text-luxury-dark">
                            Rs. {discountedUnitPrice * item.quantity}
                          </p>
                          {item.product.discount > 0 && (
                            <p className="text-[9px] text-luxury-muted line-through">
                              Rs. {item.product.price * item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item.productId, item.size, item.color)}
                      className="absolute top-2 right-2 text-neutral-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing & Footer Summary */}
          {cartItems.length > 0 && (
            <div className="bg-white border-t border-neutral-100 p-6 space-y-4 shrink-0">
              
              {/* Coupon Form */}
              <form onSubmit={handleApplyCouponSubmit} className="flex gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full bg-[#FAF9F6] text-xs font-medium uppercase tracking-wider text-luxury-dark pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:border-luxury-gold"
                  />
                  <Tag className="absolute left-3 top-3 w-3.5 h-3.5 text-luxury-gold" />
                </div>
                <button
                  type="submit"
                  className="bg-[#111] hover:bg-neutral-850 text-white px-4 py-2 rounded-lg font-semibold text-[10px] uppercase tracking-wider transition-colors shrink-0"
                >
                  Apply
                </button>
              </form>

              {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-green-600 font-semibold">{couponSuccess}</p>}

              {/* Applied Coupon Info */}
              {coupon && (
                <div className="flex items-center justify-between bg-green-50 border border-green-100 px-3.5 py-2 rounded-lg text-xs">
                  <span className="text-green-800 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> {coupon.code} Applied
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-700 font-bold">- Rs. {coupon.discountAmount}</span>
                    <button
                      onClick={removeCoupon}
                      className="text-green-700 hover:text-green-950 font-bold text-sm"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}

              {/* Price Details */}
              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between text-luxury-muted">
                  <span>Bag Subtotal</span>
                  <span>Rs. {pricing.subtotal}</span>
                </div>
                {pricing.productDiscount > 0 && (
                  <div className="flex justify-between text-luxury-accent font-semibold">
                    <span>Product Discount</span>
                    <span>- Rs. {pricing.productDiscount}</span>
                  </div>
                )}
                {pricing.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>- Rs. {pricing.couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-luxury-muted">
                  <span>GST / Tax (12%)</span>
                  <span>Rs. {pricing.tax}</span>
                </div>
                <div className="flex justify-between text-luxury-muted">
                  <span>Shipping Fee</span>
                  <span>{pricing.shipping === 0 ? 'FREE' : `Rs. ${pricing.shipping}`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-luxury-dark border-t border-neutral-100 pt-3">
                  <span>Estimated Total</span>
                  <span>Rs. {pricing.total}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCheckoutClick}
                className="w-full bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-widest py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
              >
                Proceed to Checkout <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CartDrawer;

import React, { createContext, useState, useEffect, useContext } from 'react';
import { cartAPI, checkoutAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface ProductSummary {
  id: string;
  title: string;
  brand: string;
  price: number;
  discount: number;
  images: string[];
  stock: number;
  category: string;
}

interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  product: ProductSummary;
}

interface CouponDetails {
  code: string;
  discountPercent: number;
  discountAmount: number;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (productId: string, size: string, color: string, quantity: number, product: any) => Promise<void>;
  removeFromCart: (productId: string, size: string, color: string) => Promise<void>;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  coupon: CouponDetails | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  pricing: {
    subtotal: number;
    productDiscount: number;
    couponDiscount: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);

  // Sync cart from server when user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Guest cart load
      const guestCart = localStorage.getItem('clara_luxe_guest_cart');
      if (guestCart) {
        setCartItems(JSON.parse(guestCart));
      } else {
        setCartItems([]);
      }
    }
    setCoupon(null);
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await cartAPI.getCart();
      setCartItems(data.items);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncCartToServer = async (newItems: CartItem[]) => {
    if (user) {
      try {
        const payload = newItems.map(item => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        }));
        await cartAPI.updateCart(payload);
      } catch (error) {
        console.error('Failed to sync cart to server:', error);
      }
    } else {
      localStorage.setItem('clara_luxe_guest_cart', JSON.stringify(newItems));
    }
  };

  const addToCart = async (productId: string, size: string, color: string, quantity: number, product: any) => {
    const existingIndex = cartItems.findIndex(
      item => item.productId === productId && item.size === size && item.color === color
    );

    let updatedItems = [...cartItems];

    if (existingIndex > -1) {
      updatedItems[existingIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        productId,
        size,
        color,
        quantity,
        product: {
          id: product.id,
          title: product.title,
          brand: product.brand,
          price: product.price,
          discount: product.discount,
          images: product.images,
          stock: product.stock,
          category: product.category
        }
      };
      updatedItems.push(newItem);
    }

    setCartItems(updatedItems);
    await syncCartToServer(updatedItems);
  };

  const removeFromCart = async (productId: string, size: string, color: string) => {
    const updatedItems = cartItems.filter(
      item => !(item.productId === productId && item.size === size && item.color === color)
    );
    setCartItems(updatedItems);
    await syncCartToServer(updatedItems);

    // Re-check coupon applicability
    if (coupon) {
      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const newDiscount = updatedItems.reduce((sum, item) => sum + Math.round(item.product.price * (item.product.discount / 100)) * item.quantity, 0);
      const baseSubtotal = newSubtotal - newDiscount;
      
      try {
        const data = await checkoutAPI.applyCoupon(coupon.code, baseSubtotal);
        setCoupon({
          code: data.code,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount
        });
      } catch (error) {
        // Coupon no longer applicable
        setCoupon(null);
      }
    }
  };

  const updateQuantity = async (productId: string, size: string, color: string, quantity: number) => {
    const updatedItems = cartItems.map(item => {
      if (item.productId === productId && item.size === size && item.color === color) {
        return { ...item, quantity };
      }
      return item;
    });

    setCartItems(updatedItems);
    await syncCartToServer(updatedItems);

    // Re-check coupon eligibility
    if (coupon) {
      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const newDiscount = updatedItems.reduce((sum, item) => sum + Math.round(item.product.price * (item.product.discount / 100)) * item.quantity, 0);
      const baseSubtotal = newSubtotal - newDiscount;
      
      try {
        const data = await checkoutAPI.applyCoupon(coupon.code, baseSubtotal);
        setCoupon({
          code: data.code,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount
        });
      } catch (error) {
        setCoupon(null);
      }
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    if (user) {
      cartAPI.updateCart([]);
    } else {
      localStorage.removeItem('clara_luxe_guest_cart');
    }
  };

  const applyCoupon = async (code: string) => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const productDiscount = cartItems.reduce((sum, item) => sum + Math.round(item.product.price * (item.product.discount / 100)) * item.quantity, 0);
    const baseSubtotal = subtotal - productDiscount;

    try {
      const data = await checkoutAPI.applyCoupon(code, baseSubtotal);
      setCoupon({
        code: data.code,
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount
      });
    } catch (error) {
      setCoupon(null);
      throw error;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  // Pricing calculations memoized to prevent re-runs on unrelated UI renders
  const pricing = React.useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const productDiscount = cartItems.reduce((sum, item) => sum + Math.round(item.product.price * (item.product.discount / 100)) * item.quantity, 0);
    const couponDiscount = coupon ? coupon.discountAmount : 0;
    
    const taxableAmount = Math.max(0, subtotal - productDiscount - couponDiscount);
    const tax = Math.round(taxableAmount * 0.12); // 12% GST
    
    const shipping = taxableAmount > 1499 || taxableAmount === 0 ? 0 : 99; // Free shipping over 1499
    
    const total = taxableAmount + tax + shipping;

    return {
      subtotal,
      productDiscount,
      couponDiscount,
      tax,
      shipping,
      total
    };
  }, [cartItems, coupon]);

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      coupon,
      applyCoupon,
      removeCoupon,
      pricing
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

import React, { createContext, useState, useEffect, useContext } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  discount: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  category: string;
  gender: 'men' | 'women';
  stock: number;
}

interface WishlistContextType {
  wishlistItems: Product[];
  loading: boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  moveToCart: (productId: string, size: string, color: string, addToCartFn: any) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      const guestWishlist = localStorage.getItem('clara_luxe_guest_wishlist');
      if (guestWishlist) {
        setWishlistItems(JSON.parse(guestWishlist));
      } else {
        setWishlistItems([]);
      }
    }
  }, [user]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await cartAPI.getWishlist();
      setWishlistItems(data.products);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // We can write a custom toggle that accepts the full product when toggling
  const toggleWishlist = async (product: Product) => {
    if (user) {
      try {
        const data = await cartAPI.toggleWishlist(product.id);
        setWishlistItems(data.products);
      } catch (error) {
        console.error('Failed to toggle wishlist:', error);
      }
    } else {
      let updated = [...wishlistItems];
      const idx = updated.findIndex(p => p.id === product.id);
      if (idx > -1) {
        updated.splice(idx, 1);
      } else {
        updated.push(product);
      }
      setWishlistItems(updated);
      localStorage.setItem('clara_luxe_guest_wishlist', JSON.stringify(updated));
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const moveToCart = async (productId: string, size: string, color: string, addToCartFn: any) => {
    const product = wishlistItems.find(p => p.id === productId);
    if (product) {
      // Add to cart
      await addToCartFn(productId, size, color, 1, product);
      // Remove from wishlist
      await toggleWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      loading,
      toggleWishlist,
      isInWishlist,
      moveToCart
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

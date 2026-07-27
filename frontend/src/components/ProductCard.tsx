import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Eye, CheckCircle } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { QuickViewModal } from './QuickViewModal';

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
  sizes?: string[];
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const isLiked = isInWishlist(product.id);
  const discountedPrice = product.discount > 0 
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-200/80 transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full font-sans"
      >
        {/* Image Showcase */}
        <div className="relative overflow-hidden aspect-[3/4] bg-[#F5F3EF]">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500'}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Discount Badge */}
          {product.discount > 0 && (
            <span className="absolute top-3 left-3 bg-gray-900 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-md">
              {product.discount}% OFF
            </span>
          )}

          {/* Quick View Floating Button */}
          <button
            onClick={handleQuickViewClick}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-md hover:bg-white text-gray-900 font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#C79A4A]" />
            <span>Quick View</span>
          </button>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 bg-white/85 backdrop-blur-md hover:bg-white text-gray-900 p-2 rounded-full shadow-md transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? 'fill-red-600 text-red-600' : 'text-gray-700'
              }`}
            />
          </button>

          {/* Rating floating tag */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-900 shadow-sm" style={{ display: product.discount > 0 ? 'none' : 'flex' }}>
            <span>{product.rating}</span>
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          </div>
        </div>

        {/* Info Content */}
        <div className="p-4 flex flex-col flex-grow justify-between space-y-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C79A4A] truncate">
                {product.brand}
              </span>
              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
            </div>

            <h3 className="text-xs font-semibold text-gray-900 group-hover:text-[#C79A4A] transition-colors line-clamp-1">
              {product.title}
            </h3>
          </div>

          {/* Available Sizes Pills */}
          <div className="flex items-center gap-1">
            {(product.sizes || ['S', 'M', 'L', 'XL']).slice(0, 4).map((s) => (
              <span key={s} className="text-[9px] font-bold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-1 border-t border-gray-100">
            <span className="text-sm font-bold text-gray-900">
              Rs. {discountedPrice}
            </span>
            {product.discount > 0 && (
              <span className="text-[10px] text-gray-400 line-through">
                Rs. {product.price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Drawer Modal */}
      <QuickViewModal
        product={quickViewOpen ? product : null}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
};

export default ProductCard;

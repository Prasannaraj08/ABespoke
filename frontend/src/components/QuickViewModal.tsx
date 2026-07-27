import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface QuickViewModalProps {
  product: any | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  if (!product) return null;

  const sizes = Array.isArray(product.sizes) ? product.sizes : ['S', 'M', 'L', 'XL'];
  const colors = Array.isArray(product.colors) ? product.colors : ['Classic'];

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(
        product.id,
        selectedSize || sizes[0],
        selectedColor || colors[0],
        1,
        product
      );
      setMessage('✅ Item added to your shopping bag!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const isLiked = isInWishlist(product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Showcase */}
        <div className="w-full md:w-1/2 bg-[#F5F3EF] aspect-[3/4] relative overflow-hidden">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'}
            alt={product.title}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#C79A4A] border border-[#C79A4A]/30">
            {product.brand || 'Atelier Exclusive'}
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C79A4A]">
                {product.brand}
              </span>
              <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 text-[9px] px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified Partner
              </span>
            </div>

            <h2 className="font-serif text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {product.title}
            </h2>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{product.rating || 4.8}</span>
              </div>
              <span className="text-gray-400 font-light">• In Stock ({product.stock || 12} items)</span>
            </div>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-xl font-bold text-gray-900">Rs. {product.price}</span>
              {product.discount > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  Rs. {Math.round(product.price * (1 + product.discount / 100))}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-600 font-light leading-relaxed line-clamp-3 pt-1">
              {product.description || 'Crafted with exquisite couture precision using premium luxury textiles.'}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Sizes */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Available Sizes</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      (selectedSize || sizes[0]) === s
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#C79A4A]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Color Options</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c: string) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                        (selectedColor || colors[0]) === c
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {message && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 bg-[#C79A4A] hover:bg-[#b08439] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{adding ? 'Adding...' : 'Add To Bag'}</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  isLiked ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;

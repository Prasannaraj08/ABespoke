import React from 'react';
import ProductCard from './ProductCard';

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

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="animate-pulse flex flex-col gap-3">
            <div className="bg-neutral-200/50 aspect-[3/4] w-full rounded-xl"></div>
            <div className="h-3.5 bg-neutral-200/50 rounded w-1/3"></div>
            <div className="h-3.5 bg-neutral-200/50 rounded w-2/3"></div>
            <div className="h-4 bg-neutral-200/50 rounded w-1/2 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-white rounded-xl border border-neutral-100/60 shadow-sm max-w-2xl mx-auto my-8">
        <h3 className="font-serif text-xl text-luxury-dark mb-2">No styles found</h3>
        <p className="text-xs text-luxury-muted font-light max-w-sm mx-auto leading-relaxed">
          We couldn't find any products matching your selection. Try clearing filters or searching for another key term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
export default ProductGrid;

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { productsAPI } from '../services/api';

const categoryBanners: Record<string, { title: string; desc: string; image: string }> = {
  'Sarees': {
    title: 'Exquisite Sarees',
    desc: 'Timeless elegance hand-woven in pure silk, featuring gold zari borders and matching pallus.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&auto=format&fit=crop&q=80'
  },
  'Lehengas': {
    title: 'Festive Lehengas',
    desc: 'Luxurious flared silhouettes, zardozi embroideries, and premium organza draping.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&auto=format&fit=crop&q=80'
  },
  'Hoodies': {
    title: 'Premium Hoodies',
    desc: 'Oversized fleece, cashmere blends, and sporty silhouettes for daily premium comfort.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=80'
  },
  'Half Sarees': {
    title: 'Traditional Half Sarees',
    desc: 'Classic South Indian pavadai davani attire with temple borders and rich silk fabrics.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1600&auto=format&fit=crop&q=80'
  },
  'Kurtis': {
    title: 'Designer Kurtis',
    desc: 'Chikankari hand embroideries, flared Anarkalis, and modern linen tunic lengths.',
    image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=1600&auto=format&fit=crop&q=80'
  },
  'Shirts': {
    title: 'Premium Shirts',
    desc: 'Classic tailored Oxford shirts, casual summer linens, and crisp double-ply cottons.',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&auto=format&fit=crop&q=80'
  },
  'Pants': {
    title: 'Tailored Pants & Chinos',
    desc: 'Flat-front stretch chinos, wool-blend dress trousers, and comfortable summer linen cargos.',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1600&auto=format&fit=crop&q=80'
  },
  'Blazers': {
    title: 'Sophisticated Blazers',
    desc: 'Italian tweed suit blazers, double-breasted flannels, and unstructured casual linens.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&auto=format&fit=crop&q=80'
  },
  'Jeans': {
    title: 'Designer Denim Jeans',
    desc: 'Straight-leg vintage selvedge denims, distressed black street washes, and raw rigid indigo denim.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1600&auto=format&fit=crop&q=80'
  }
};

export const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageMeta, setPageMeta] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  // Filter lists populated dynamically
  const [filterMeta, setFilterMeta] = useState<any>({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    fabrics: [],
    fits: [],
    occasions: [],
    patterns: []
  });

  // Sidebar controls
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [minDiscount, setMinDiscount] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch filter metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const meta = await productsAPI.getMeta();
        setFilterMeta(meta);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Sync state with URL search params on change
  useEffect(() => {
    // Sync gender/category/trending parameters
    const brandsParam = searchParams.get('brand');
    const categoriesParam = searchParams.get('category');
    const sizesParam = searchParams.get('size');
    const colorsParam = searchParams.get('color');
    const fabricsParam = searchParams.get('fabric');
    const occasionsParam = searchParams.get('occasion');
    const sortParam = searchParams.get('sort');

    setSelectedBrands(brandsParam ? brandsParam.split(',') : []);
    setSelectedCategories(categoriesParam ? categoriesParam.split(',') : []);
    setSelectedSizes(sizesParam ? sizesParam.split(',') : []);
    setSelectedColors(colorsParam ? colorsParam.split(',') : []);
    setSelectedFabrics(fabricsParam ? fabricsParam.split(',') : []);
    setSelectedOccasions(occasionsParam ? occasionsParam.split(',') : []);
    setPriceRange({
      min: searchParams.get('minPrice') || '',
      max: searchParams.get('maxPrice') || ''
    });
    setMinDiscount(searchParams.get('minDiscount') || '');
    setMinRating(searchParams.get('minRating') || '');
    setSortBy(sortParam || 'recommended');

    fetchCatalogProducts();
  }, [searchParams]);

  const getFilteredCategories = () => {
    const categories = Array.isArray(filterMeta.categories) ? filterMeta.categories : [];
    const gender = searchParams.get('gender');
    if (gender === 'women') {
      return categories.filter((c: string) =>
        ['Sarees', 'Lehengas', 'Hoodies', 'Half Sarees', 'Kurtis'].includes(c)
      );
    }
    if (gender === 'men') {
      return categories.filter((c: string) =>
        ['Shirts', 'Pants', 'Hoodies', 'Blazers', 'Jeans'].includes(c)
      );
    }
    return categories;
  };

  const fetchCatalogProducts = async () => {
    setLoading(true);
    try {
      const queryParams: any = {};
      
      // Pass general query text
      const q = searchParams.get('q');
      if (q) queryParams.q = q;

      const gender = searchParams.get('gender');
      if (gender) queryParams.gender = gender;

      const trending = searchParams.get('trending');
      if (trending) queryParams.trending = trending;

      // Pass selections
      const brand = searchParams.get('brand');
      if (brand) queryParams.brand = brand;

      const category = searchParams.get('category');
      if (category) queryParams.category = category;

      const size = searchParams.get('size');
      if (size) queryParams.size = size;

      const color = searchParams.get('color');
      if (color) queryParams.color = color;

      const fabric = searchParams.get('fabric');
      if (fabric) queryParams.fabric = fabric;

      const fit = searchParams.get('fit');
      if (fit) queryParams.fit = fit;

      const occasion = searchParams.get('occasion');
      if (occasion) queryParams.occasion = occasion;

      const pattern = searchParams.get('pattern');
      if (pattern) queryParams.pattern = pattern;

      const minPrice = searchParams.get('minPrice');
      if (minPrice) queryParams.minPrice = minPrice;

      const maxPrice = searchParams.get('maxPrice');
      if (maxPrice) queryParams.maxPrice = maxPrice;

      const minDiscountParam = searchParams.get('minDiscount');
      if (minDiscountParam) queryParams.minDiscount = minDiscountParam;

      const minRatingParam = searchParams.get('minRating');
      if (minRatingParam) queryParams.minRating = minRatingParam;

      // Pagination and Sort
      queryParams.sort = searchParams.get('sort') || 'recommended';
      queryParams.page = searchParams.get('page') || '1';
      queryParams.limit = '12';

      const data = await productsAPI.getProducts(queryParams);
      setProducts(data.products);
      setPageMeta(data.pagination);
    } catch (err) {
      console.error('Failed to load catalog products:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParam = (key: string, values: string[]) => {
    const nextParams = new URLSearchParams(searchParams);
    if (values.length > 0) {
      nextParams.set(key, values.join(','));
    } else {
      nextParams.delete(key);
    }
    // reset to page 1 when filter changes
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const handleCheckboxToggle = (list: string[], setFn: any, key: string, item: string) => {
    const updated = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setFn(updated);
    updateSearchParam(key, updated);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (priceRange.min) nextParams.set('minPrice', priceRange.min);
    else nextParams.delete('minPrice');
    if (priceRange.max) nextParams.set('maxPrice', priceRange.max);
    else nextParams.delete('maxPrice');
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const handleDiscountSelect = (discount: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (discount) nextParams.set('minDiscount', discount);
    else nextParams.delete('minDiscount');
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const handleRatingSelect = (rating: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (rating) nextParams.set('minRating', rating);
    else nextParams.delete('minRating');
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sort', sort);
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    const q = searchParams.get('q');
    const gender = searchParams.get('gender');
    const nextParams = new URLSearchParams();
    if (q) nextParams.set('q', q);
    if (gender) nextParams.set('gender', gender);
    setSearchParams(nextParams);
  };

  const activeGender = searchParams.get('gender');
  const activeQuery = searchParams.get('q');
  const activeCategory = searchParams.get('category');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 font-sans space-y-8">
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs text-luxury-muted font-sans font-light uppercase tracking-wider">
        <Link to="/" className="hover:text-luxury-gold transition-colors">Home</Link>
        <span>/</span>
        {activeGender ? (
          <>
            <Link to={`/catalog?gender=${activeGender}`} className="hover:text-luxury-gold transition-colors">{activeGender}</Link>
            {activeCategory && (
              <>
                <span>/</span>
                <span className="text-luxury-dark font-medium">{activeCategory}</span>
              </>
            )}
          </>
        ) : (
          <span className="text-luxury-dark font-medium">Collections</span>
        )}
      </div>

      {/* Category Banner Card */}
      {activeCategory && categoryBanners[activeCategory] ? (
        <div className="relative h-[220px] w-full rounded-xl overflow-hidden bg-neutral-900 shadow-sm flex items-center">
          <img 
            src={categoryBanners[activeCategory].image} 
            alt={activeCategory} 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
          <div className="relative z-10 pl-8 lg:pl-12 max-w-xl text-white space-y-3 font-sans">
            <span className="bg-luxury-gold text-white px-2.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold">Category Feature</span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-wide uppercase">
              {categoryBanners[activeCategory].title}
            </h2>
            <p className="text-xs text-[#ddd] leading-relaxed font-light">
              {categoryBanners[activeCategory].desc}
            </p>
          </div>
        </div>
      ) : activeGender ? (
        <div className="relative h-[160px] w-full rounded-xl overflow-hidden bg-neutral-900 shadow-sm flex items-center">
          <img 
            src={activeGender === 'women' 
              ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1600&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1600&auto=format&fit=crop&q=80'
            } 
            alt={activeGender} 
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="relative z-10 pl-8 lg:pl-12 text-white space-y-1.5 font-sans">
            <h2 className="font-serif text-2xl font-bold tracking-widest uppercase">
              {activeGender}'s Collection
            </h2>
            <p className="text-xs text-[#ddd] font-light">
              Browse our premier designer lines and handcrafted staples.
            </p>
          </div>
        </div>
      ) : null}

      {/* 1. Page Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-luxury-dark uppercase tracking-wide">
            {activeGender ? `${activeGender}'s Collection` : 'Catalog'}
          </h1>
          <p className="text-xs text-luxury-muted mt-1 font-light">
            {activeQuery ? `Search results for "${activeQuery}"` : 'Discover curated fashion lines and premium brands'}
            {` (${pageMeta.total} items)`}
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs font-sans">
          <span className="text-luxury-muted font-light">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-white border border-neutral-200 text-luxury-dark font-medium py-2 px-3 rounded-lg focus:outline-none focus:border-luxury-gold text-[10px] uppercase tracking-wider"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low-to-high">Price: Low to High</option>
            <option value="price-high-to-low">Price: High to Low</option>
            <option value="customer-rating">Customer Rating</option>
            <option value="new-arrivals">New Arrivals</option>
            <option value="discount-desc">Better Discount</option>
          </select>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-1.5 border border-neutral-200 bg-white text-luxury-dark px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-semibold"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="flex gap-8 items-start">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-[240px] shrink-0 space-y-6 max-h-[85vh] overflow-y-auto pr-2 pb-6 border-r border-neutral-100">
          
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-luxury-dark">Filters</h3>
            <button
              onClick={clearAllFilters}
              className="text-[9px] uppercase font-bold text-luxury-gold hover:text-luxury-dark flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Clear All
            </button>
          </div>

          {/* Categories */}
          <div className="border-t border-neutral-100 pt-4 space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark">Categories</h4>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto font-sans">
              {getFilteredCategories().map((cat: string) => (
                <label key={cat} className="flex items-center gap-2.5 text-xs text-neutral-600 cursor-pointer hover:text-luxury-gold transition-colors font-sans">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCheckboxToggle(selectedCategories, setSelectedCategories, 'category', cat)}
                    className="w-3.5 h-3.5 rounded accent-luxury-gold border-neutral-300"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="border-t border-neutral-100 pt-4 space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark">Brands</h4>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {filterMeta.brands.map((b: string) => (
                <label key={b} className="flex items-center gap-2.5 text-xs text-neutral-600 cursor-pointer hover:text-luxury-gold transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b)}
                    onChange={() => handleCheckboxToggle(selectedBrands, setSelectedBrands, 'brand', b)}
                    className="w-3.5 h-3.5 rounded accent-luxury-gold border-neutral-300"
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t border-neutral-100 pt-4 space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark">Price Range</h4>
            <form onSubmit={handlePriceApply} className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="bg-[#FAF9F6] border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-luxury-dark w-full focus:outline-none focus:border-luxury-gold"
              />
              <span className="text-xs text-luxury-muted">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="bg-[#FAF9F6] border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-luxury-dark w-full focus:outline-none focus:border-luxury-gold"
              />
              <button
                type="submit"
                className="bg-[#111] hover:bg-neutral-800 text-white px-3 py-1.5 rounded text-[10px] font-semibold transition-colors uppercase shrink-0"
              >
                Go
              </button>
            </form>
          </div>

          {/* Sizes */}
          <div className="border-t border-neutral-100 pt-4 space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark">Sizes</h4>
            <div className="flex flex-wrap gap-1.5">
              {filterMeta.sizes.map((s: string) => {
                const isSel = selectedSizes.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => handleCheckboxToggle(selectedSizes, setSelectedSizes, 'size', s)}
                    className={`border px-2.5 py-1 rounded text-[10px] font-sans font-medium transition-all ${
                      isSel
                        ? 'border-luxury-dark bg-luxury-dark text-white'
                        : 'border-neutral-200 hover:border-luxury-gold text-luxury-dark'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors */}
          <div className="border-t border-neutral-100 pt-4 space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark">Colors</h4>
            <div className="flex flex-wrap gap-2">
              {filterMeta.colors.map((c: string) => {
                const isSel = selectedColors.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => handleCheckboxToggle(selectedColors, setSelectedColors, 'color', c)}
                    className={`border rounded-full px-2.5 py-0.5 text-[10px] font-medium font-sans flex items-center gap-1.5 transition-all ${
                      isSel
                        ? 'border-luxury-dark bg-luxury-dark text-white'
                        : 'border-neutral-200 hover:border-luxury-gold bg-white text-luxury-dark'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discounts */}
          <div className="border-t border-[#ECE8DF]/60 pt-4 space-y-2.5">
            <h4 className="text-xs uppercase font-bold tracking-wider text-luxury-dark">Discounts</h4>
            <div className="flex flex-col gap-2 text-xs text-[#555]">
              {['10', '20', '30', '50'].map((d) => (
                <label key={d} className="flex items-center gap-2 cursor-pointer hover:text-luxury-gold transition-colors">
                  <input
                    type="radio"
                    name="discount"
                    checked={minDiscount === d}
                    onChange={() => handleDiscountSelect(d)}
                    className="accent-luxury-gold"
                  />
                  {d}% and above
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer hover:text-luxury-gold transition-colors">
                <input
                  type="radio"
                  name="discount"
                  checked={minDiscount === ''}
                  onChange={() => handleDiscountSelect('')}
                  className="accent-luxury-gold"
                />
                Any discount
              </label>
            </div>
          </div>

          {/* Ratings */}
          <div className="border-t border-[#ECE8DF]/60 pt-4 space-y-2.5">
            <h4 className="text-xs uppercase font-bold tracking-wider text-luxury-dark">Customer Rating</h4>
            <div className="flex flex-col gap-2 text-xs text-[#555]">
              {['4.5', '4.0', '3.5'].map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer hover:text-luxury-gold transition-colors">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === r}
                    onChange={() => handleRatingSelect(r)}
                    className="accent-luxury-gold"
                  />
                  {r} ★ and above
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer hover:text-luxury-gold transition-colors">
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === ''}
                  onChange={() => handleRatingSelect('')}
                  className="accent-luxury-gold"
                />
                Any rating
              </label>
            </div>
          </div>

          {/* Fabrics */}
          {filterMeta.fabrics.length > 0 && (
            <div className="border-t border-[#ECE8DF]/60 pt-4 space-y-2.5">
              <h4 className="text-xs uppercase font-bold tracking-wider text-luxury-dark">Fabric</h4>
              <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                {filterMeta.fabrics.map((f: string) => (
                  <label key={f} className="flex items-center gap-2 text-xs text-[#555] cursor-pointer hover:text-luxury-gold">
                    <input
                      type="checkbox"
                      checked={selectedFabrics.includes(f)}
                      onChange={() => handleCheckboxToggle(selectedFabrics, setSelectedFabrics, 'fabric', f)}
                      className="w-3.5 h-3.5 accent-luxury-gold rounded border-zinc-300"
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Occasions */}
          {filterMeta.occasions.length > 0 && (
            <div className="border-t border-[#ECE8DF]/60 pt-4 space-y-2.5">
              <h4 className="text-xs uppercase font-bold tracking-wider text-luxury-dark">Occasion</h4>
              <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                {filterMeta.occasions.map((o: string) => (
                  <label key={o} className="flex items-center gap-2 text-xs text-[#555] cursor-pointer hover:text-luxury-gold">
                    <input
                      type="checkbox"
                      checked={selectedOccasions.includes(o)}
                      onChange={() => handleCheckboxToggle(selectedOccasions, setSelectedOccasions, 'occasion', o)}
                      className="w-3.5 h-3.5 accent-luxury-gold rounded border-zinc-300"
                    />
                    {o}
                  </label>
                ))}
              </div>
            </div>
          )}

        </aside>

        {/* Catalog Main Listing */}
        <div className="flex-1 space-y-12">
          
          <ProductGrid products={products} loading={loading} />

          {/* 3. Pagination Controls */}
          {pageMeta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 border-t border-[#ECE8DF]/40 pt-8 font-sans">
              <button
                onClick={() => handlePageChange(pageMeta.page - 1)}
                disabled={pageMeta.page <= 1}
                className="px-4 py-2 border border-[#EBE6DC] rounded-xl text-xs uppercase tracking-wider font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-luxury-cream transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: pageMeta.totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                const isAct = pageMeta.page === pNum;
                return (
                  <button
                    key={pNum}
                    onClick={() => handlePageChange(pNum)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      isAct
                        ? 'bg-luxury-dark text-white'
                        : 'border border-neutral-200 text-luxury-dark hover:bg-neutral-50'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pageMeta.page + 1)}
                disabled={pageMeta.page >= pageMeta.totalPages}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-xs uppercase tracking-wider font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden font-sans">
          <div className="absolute inset-0 bg-black/45" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col h-full">
              <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center bg-white">
                <h3 className="font-serif text-base font-bold text-luxury-dark">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-1"><X className="w-4 h-4 text-luxury-dark" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {/* Mobile version of side-panel filters */}
                <button
                  onClick={() => { clearAllFilters(); setShowMobileFilters(false); }}
                  className="w-full bg-white border border-neutral-200 py-2.5 rounded-lg text-xs uppercase tracking-wider font-semibold text-luxury-dark hover:bg-neutral-50 transition-colors"
                >
                  Clear All Filters
                </button>
                
                {/* Categories */}
                <div className="space-y-2.5">
                  <h4 className="text-xs uppercase font-bold text-luxury-dark">Categories</h4>
                  <div className="flex flex-col gap-2">
                    {getFilteredCategories().map((cat: string) => (
                      <label key={cat} className="flex items-center gap-2.5 text-xs text-neutral-600">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => handleCheckboxToggle(selectedCategories, setSelectedCategories, 'category', cat)}
                          className="w-3.5 h-3.5 accent-luxury-gold rounded border-neutral-300"
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-neutral-100 pt-4">
                  <h4 className="text-xs uppercase font-bold text-luxury-dark">Brands</h4>
                  <div className="flex flex-col gap-2">
                    {filterMeta.brands.map((b: string) => (
                      <label key={b} className="flex items-center gap-2.5 text-xs text-neutral-600">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(b)}
                          onChange={() => handleCheckboxToggle(selectedBrands, setSelectedBrands, 'brand', b)}
                          className="w-3.5 h-3.5 accent-luxury-gold rounded border-neutral-300"
                        />
                        {b}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white border-t border-neutral-100 shrink-0">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-widest py-3.5 rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Catalog;

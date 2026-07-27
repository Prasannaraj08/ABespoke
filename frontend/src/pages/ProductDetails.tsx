import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, Share2, Truck, CheckCircle, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { productsAPI, aiAPI } from '../services/api';
import ProductGrid from '../components/ProductGrid';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [bundleProducts, setBundleProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User selections
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Pincode check
  const [pincode, setPincode] = useState('');
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState('');
  const [codAvailable, setCodAvailable] = useState(false);

  // Review submission
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Image zoom state
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%' });

  useEffect(() => {
    if (id) {
      loadProductDetails();
      // Track recently viewed products in localStorage for AI recommendation algorithms
      const viewedStr = localStorage.getItem('viewed_products') || '[]';
      const viewedList = JSON.parse(viewedStr);
      if (!viewedList.includes(id)) {
        viewedList.push(id);
        localStorage.setItem('viewed_products', JSON.stringify(viewedList.slice(-10))); // keep last 10
      }
    }
  }, [id]);

  const loadProductDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await productsAPI.getProductById(id);
      setProduct(data.product);
      setReviews(data.reviews);
      setSelectedImage(data.product.images[0]);
      
      // Pre-select first size and color
      if (data.product.sizes?.length) setSelectedSize(data.product.sizes[0]);
      if (data.product.colors?.length) setSelectedColor(data.product.colors[0]);

      // Load recommendations
      const similar = await aiAPI.getSimilar(id);
      setSimilarProducts(similar);

      const bundle = await aiAPI.getBundle(id);
      setBundleProducts(bundle);

      setPincodeChecked(false);
      setPincode('');
      setPincodeMessage('');
    } catch (err) {
      console.error('Failed to load product details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Image Zoom-on-Hover handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none', backgroundPosition: '0% 0%' });
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.length !== 6 || isNaN(Number(pincode))) {
      setPincodeMessage('Please enter a valid 6-digit pincode.');
      setPincodeChecked(true);
      setCodAvailable(false);
      return;
    }

    // Simulate backend delivery estimation logic based on pincode prefixes
    const prefix = pincode[0];
    let days = 3;
    if (prefix === '1' || prefix === '2') {
      days = 1; // Metro delivery
      setCodAvailable(true);
    } else if (prefix === '3' || prefix === '4') {
      days = 2; // Suburban delivery
      setCodAvailable(true);
    } else {
      days = 4; // Outstation delivery
      setCodAvailable(false);
    }

    setPincodeMessage(`Delivery expected by ${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}.`);
    setPincodeChecked(true);
  };

  const handleAddToCartClick = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, selectedSize, selectedColor, quantity, product);
      // Optional: trigger cart drawer open or prompt
      alert('Product added to your bag!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyNowClick = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, selectedSize, selectedColor, quantity, product);
      navigate('/checkout');
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyBundleClick = async () => {
    if (!product || !bundleProducts.length) return;
    try {
      // Add main product
      await addToCart(product.id, selectedSize, selectedColor, 1, product);
      
      // Add bundle accessories with default sizes/colors
      for (const bp of bundleProducts) {
        const size = bp.sizes?.length ? bp.sizes[0] : 'One Size';
        const color = bp.colors?.length ? bp.colors[0] : 'Default';
        await addToCart(bp.id, size, color, 1, bp);
      }
      alert('Bundle added to bag with special pairing discount!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!newComment.trim()) {
      setReviewError('Review comment cannot be empty.');
      return;
    }

    try {
      const data = await productsAPI.addReview(product.id, { rating: newRating, comment: newComment });
      setReviewSuccess('Thank you! Your review has been recorded.');
      setNewComment('');
      
      // Refresh review list and product stats
      setReviews([data.review, ...reviews]);
      setProduct({
        ...product,
        rating: data.productRating,
        reviewsCount: data.productReviewsCount
      });
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Check out this gorgeous ${product.title} from ABespoke!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 animate-pulse space-y-8 font-sans">
        <div className="flex flex-col md:flex-row gap-10">
          <div className="bg-[#ECE8DF] rounded-2xl w-full md:w-1/2 aspect-[3/4]"></div>
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-6 bg-[#ECE8DF] rounded w-1/4"></div>
            <div className="h-10 bg-[#ECE8DF] rounded w-3/4"></div>
            <div className="h-4 bg-[#ECE8DF] rounded w-1/3"></div>
            <div className="h-8 bg-[#ECE8DF] rounded w-1/2 mt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 font-serif">
        <h2 className="text-2xl text-luxury-dark">Product Not Found</h2>
        <button onClick={() => navigate('/catalog')} className="mt-4 bg-luxury-dark text-white px-6 py-2 rounded-xl">Back to Catalog</button>
      </div>
    );
  }

  const isLiked = isInWishlist(product.id);
  const discountedPrice = Math.round(product.price * (1 - product.discount / 100));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans space-y-16">
      
      {/* 1. Main Showcase Section */}
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-[55%] flex flex-col md:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex md:flex-col order-2 md:order-1 gap-2.5 overflow-x-auto md:overflow-x-visible shrink-0">
            {product.images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-16 h-20 bg-luxury-cream rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === img ? 'border-luxury-gold' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover object-top" />
              </button>
            ))}
          </div>

          {/* Main Zoomable Image */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="flex-1 order-1 md:order-2 bg-luxury-cream rounded-xl overflow-hidden relative aspect-[3/4] border border-neutral-100 cursor-zoom-in"
          >
            <img
              src={selectedImage}
              alt={product.title}
              className="w-full h-full object-cover object-top"
            />
            {/* Zoom Overlay panel */}
            <div
              className="absolute inset-0 pointer-events-none bg-no-repeat transition-opacity duration-300"
              style={{
                ...zoomStyle,
                backgroundImage: `url(${selectedImage})`,
                backgroundSize: '200%',
              }}
            />
          </div>
        </div>

        {/* Right: Buy Panel */}
        <div className="w-full lg:w-[45%] space-y-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-widest text-luxury-muted">
                {product.brand}
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-2 py-0.5 rounded-full font-bold">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified Partner
              </span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-luxury-dark mt-1">
              {product.title}
            </h1>
            
            {/* Rating Stars summary */}
            <div className="flex items-center gap-2 mt-2 font-sans">
              <div className="flex bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 items-center gap-1 text-[10px] font-semibold text-luxury-dark">
                <span>{product.rating}</span>
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              </div>
              <span className="text-[10px] text-luxury-muted font-light border-l border-zinc-200 pl-2">
                {product.reviewsCount} Customer Reviews
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-y border-neutral-100 py-4 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold text-luxury-dark">Rs. {discountedPrice}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-xs text-luxury-muted line-through">Rs. {product.price}</span>
                  <span className="text-xs text-luxury-accent font-bold uppercase tracking-wider">({product.discount}% OFF)</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-green-600 font-medium font-sans">inclusive of all taxes</p>
          </div>

          {/* Color Selector */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark">Select Color: <span className="text-luxury-gold">{selectedColor}</span></h4>
            <div className="flex gap-2">
              {product.colors.map((col: string) => (
                <button
                  key={col}
                  onClick={() => setSelectedColor(col)}
                  className={`border px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    selectedColor === col
                      ? 'border-luxury-dark bg-luxury-dark text-white'
                      : 'border-neutral-200 hover:border-luxury-gold text-luxury-dark bg-white'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark flex justify-between">
              <span>Select Size: <span className="text-luxury-gold font-bold">{selectedSize}</span></span>
              <a href="#" className="text-luxury-gold hover:underline text-[9px] lowercase tracking-wide font-normal">size guide</a>
            </h4>
            <div className="flex gap-2">
              {product.sizes.map((sz: string) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`w-9 h-9 border rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    selectedSize === sz
                      ? 'border-luxury-dark bg-luxury-dark text-white'
                      : 'border-neutral-200 hover:border-luxury-gold text-luxury-dark bg-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Primary Actions */}
          <div className="space-y-3.5 pt-2">
            <div className="flex gap-4">
              {/* Quantity dropdown */}
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="bg-white border border-neutral-200 rounded-lg text-xs font-semibold py-3 px-3 focus:outline-none focus:border-luxury-gold"
              >
                {[1, 2, 3, 4, 5].map(q => (
                  <option key={q} value={q}>Qty: {q}</option>
                ))}
              </select>

              {/* Add to Bag */}
              <button
                onClick={handleAddToCartClick}
                disabled={product.stock === 0}
                className="flex-1 bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-zinc-200"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> {product.stock === 0 ? 'Out of Stock' : 'Add to Bag'}
              </button>

              {/* Wishlist Toggle */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`border p-3 rounded-lg flex items-center justify-center transition-all ${
                  isLiked
                    ? 'border-luxury-accent bg-red-50 text-luxury-accent'
                    : 'border-neutral-200 hover:border-luxury-dark text-luxury-dark bg-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-luxury-accent' : ''}`} />
              </button>
            </div>

            {/* Buy Now & Share */}
            <div className="flex gap-4">
              <button
                onClick={handleBuyNowClick}
                disabled={product.stock === 0}
                className="flex-1 bg-luxury-gold hover:bg-[#a3803b] text-white font-semibold text-[10px] uppercase tracking-widest py-3 rounded-lg transition-colors"
              >
                Buy It Now
              </button>
              <button
                onClick={shareProduct}
                className="border border-neutral-200 hover:border-luxury-dark text-luxury-dark px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-white transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>

          {/* Delivery Check Section */}
          <div className="border border-neutral-100 bg-white rounded-xl p-4 space-y-3 font-sans shadow-sm">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-dark flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-luxury-gold" /> Check Delivery Availability
            </h4>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter Pincode (e.g., 110001)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="bg-[#FAF9F6] border border-neutral-200 rounded px-3 py-2 text-xs w-full focus:outline-none focus:border-luxury-gold"
              />
              <button
                type="submit"
                className="bg-[#111] hover:bg-neutral-800 text-white text-[10px] font-semibold px-4 py-2 rounded transition-colors uppercase shrink-0"
              >
                Check
              </button>
            </form>
            {pincodeChecked && (
              <div className="space-y-1 text-[11px] font-sans">
                <p className="text-[#333] font-medium">{pincodeMessage}</p>
                <p className={`font-semibold ${codAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                  {codAvailable ? '✓ Cash on Delivery is Available' : '⚠ Online Payment Only'}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 2. Frequently Bought Together Bundle (AI Component) */}
      {bundleProducts.length > 0 && (
        <div className="border border-neutral-100 bg-white rounded-xl p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-luxury-dark flex items-center gap-2">
              <Star className="w-4.5 h-4.5 text-luxury-gold fill-luxury-gold" /> Frequently Bought Together
            </h3>
            <p className="text-xs text-luxury-muted font-light">Complete the designer look. Buy the bundle to receive an extra pairing discount.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 font-sans">
            {/* Visual products flow */}
            <div className="flex flex-wrap items-center gap-4 text-center">
              {/* Product 1 */}
              <div className="w-24 space-y-2">
                <div className="h-28 rounded overflow-hidden bg-luxury-cream border border-neutral-100">
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover object-top" />
                </div>
                <p className="text-[9px] font-semibold truncate leading-tight">{product.title}</p>
                <p className="text-xs font-bold">Rs. {discountedPrice}</p>
              </div>
              
              <span className="text-lg font-bold text-luxury-gold">+</span>

              {/* Loop bundle accessories */}
              {bundleProducts.map((bp, idx) => {
                const discPrice = Math.round(bp.price * (1 - bp.discount / 100));
                return (
                  <React.Fragment key={bp.id}>
                    <div className="w-24 space-y-2">
                      <div className="h-28 rounded overflow-hidden bg-luxury-cream border border-neutral-100">
                        <img src={bp.images[0]} alt="" className="w-full h-full object-cover object-top" />
                      </div>
                      <p className="text-[9px] font-semibold truncate leading-tight">{bp.title}</p>
                      <p className="text-xs font-bold">Rs. {discPrice}</p>
                    </div>
                    {idx < bundleProducts.length - 1 && <span className="text-lg font-bold text-luxury-gold">+</span>}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Total calculation & Add Button */}
            <div className="bg-[#FAF9F6] border border-neutral-200 p-5 rounded-xl text-center lg:text-left min-w-[240px] space-y-3">
              <div className="text-xs space-y-1">
                <p className="text-luxury-muted">Combined Price:</p>
                <p className="text-base font-bold text-luxury-dark font-sans">
                  Rs. {discountedPrice + bundleProducts.reduce((sum, bp) => sum + Math.round(bp.price * (1 - bp.discount / 100)), 0)}
                </p>
              </div>
              <button
                onClick={handleBuyBundleClick}
                className="w-full bg-luxury-dark hover:bg-[#222] text-white font-semibold text-[10px] uppercase tracking-wider py-2.5 rounded-lg transition-colors"
              >
                Add 3 Items to Bag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Product Specifications Table */}
      <div className="border border-neutral-100 bg-white rounded-xl p-6 lg:p-8 space-y-5 font-sans shadow-sm">
        <h3 className="font-serif text-lg font-bold text-luxury-dark">Product Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
          <div className="flex justify-between py-2 border-b border-neutral-100/60">
            <span className="text-luxury-muted font-light">Fabric Material</span>
            <span className="font-medium text-luxury-dark">{product.fabric}</span>
          </div>
          {product.sleeve && (
            <div className="flex justify-between py-2 border-b border-neutral-100/60">
              <span className="text-luxury-muted font-light">Sleeve Style</span>
              <span className="font-medium text-luxury-dark">{product.sleeve}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-neutral-100/60">
            <span className="text-luxury-muted font-light">Fitting type</span>
            <span className="font-medium text-luxury-dark">{product.fit}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100/60">
            <span className="text-luxury-muted font-light">Occasion classification</span>
            <span className="font-medium text-luxury-dark">{product.occasion}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100/60">
            <span className="text-luxury-muted font-light">Print Pattern</span>
            <span className="font-medium text-luxury-dark">{product.pattern}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-100/60">
            <span className="text-luxury-muted font-light">Stock availability</span>
            <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `In Stock (${product.stock} items)` : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Customer Reviews & Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Reviews List */}
        <div className="space-y-6">
          <h3 className="font-serif text-lg font-bold text-luxury-dark border-b border-neutral-100 pb-4">
            Reviews ({reviews.length})
          </h3>
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {reviews.length === 0 ? (
              <p className="text-xs text-luxury-muted font-light">Be the first to review this product.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-white border border-neutral-100 rounded-xl space-y-2 shadow-sm">
                  <div className="flex justify-between items-start font-sans">
                    <div>
                      <p className="text-xs font-semibold text-luxury-dark">{rev.userName}</p>
                      <p className="text-[10px] text-luxury-muted font-light">{new Date(rev.createdAt).toLocaleDateString()}</p>
                    </div>
                    {/* Stars */}
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 font-light leading-relaxed font-sans">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit Review form */}
        <div className="bg-white border border-neutral-100 rounded-xl p-6 space-y-4 font-sans shadow-sm">
          <h3 className="font-serif text-lg font-bold text-luxury-dark border-b border-neutral-100 pb-3">Write a Review</h3>
          {user ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-luxury-muted">Select Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-0.5 text-amber-500 focus:outline-none"
                    >
                      <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-500 text-amber-500' : 'text-zinc-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-luxury-muted">Your Experience</label>
                <textarea
                  rows={4}
                  placeholder="Share details of your experience with size, fitting, fabric and design..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-3 text-xs focus:outline-none focus:border-luxury-gold"
                />
              </div>

              {reviewError && <p className="text-[10px] text-red-500 font-semibold">{reviewError}</p>}
              {reviewSuccess && <p className="text-[10px] text-green-600 font-semibold">{reviewSuccess}</p>}

              <button
                type="submit"
                className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider py-3 px-6 rounded-lg transition-colors"
              >
                Submit Review
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-luxury-gold mx-auto mb-2" />
              <p className="text-xs text-luxury-muted font-light mb-3">You must be logged in to leave a review.</p>
              <button
                onClick={() => navigate('/login')}
                className="bg-luxury-dark hover:bg-neutral-800 text-white px-5 py-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Similar Styles Recommendations (AI Component) */}
      {similarProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-luxury-dark">Similar Styles</h2>
          <ProductGrid products={similarProducts} />
        </div>
      )}

    </div>
  );
};
export default ProductDetails;

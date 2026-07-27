import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, ChevronDown, CheckCircle, Star, Quote, Mail } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productsAPI, publicBoutiqueAPI, designerAPI } from '../services/api';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [boutiques, setBoutiques] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const arrivalData = await productsAPI.getProducts({ sort: 'new-arrivals', limit: 4 });
        const trendingData = await productsAPI.getProducts({ sort: 'recommended', limit: 4 });
        const boutiqueData = await publicBoutiqueAPI.getBoutiques();
        const designerData = await designerAPI.getDesigners();

        const arr = Array.isArray(arrivalData) ? arrivalData : (arrivalData?.products || []);
        const tr = Array.isArray(trendingData) ? trendingData : (trendingData?.products || []);
        const bts = Array.isArray(boutiqueData) ? boutiqueData : (boutiqueData?.data || []);
        const dsg = Array.isArray(designerData) ? designerData : (designerData?.data || []);

        setNewArrivals(arr);
        setTrending(tr);
        setBoutiques(bts.slice(0, 3));
        setDesigners(dsg.slice(0, 3));
      } catch (err) {
        console.error('Failed to load home page products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 5000);
      setNewsletterEmail('');
    }
  };

  const categories = [
    {
      name: 'Bridal & Couture Sarees',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      link: '/catalog?gender=women&category=Sarees',
      desc: 'Hand-woven pure silk & organza sarees'
    },
    {
      name: 'Flared Royal Lehengas',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      link: '/catalog?gender=women&category=Lehengas',
      desc: 'Intricate zardozi & sequin craftsmanship'
    },
    {
      name: 'Contemporary Kurtis',
      image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=600&auto=format&fit=crop&q=80',
      link: '/catalog?gender=women&category=Kurtis',
      desc: 'Refined modern silhouettes for everyday luxury'
    },
    {
      name: 'Bespoke Tailored Shirts',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
      link: '/catalog?gender=men&category=Shirts',
      desc: 'Egyptian cotton & crisp linen formal shirts'
    },
    {
      name: 'Structured Tuxedo Blazers',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      link: '/catalog?gender=men&category=Blazers',
      desc: 'Italian wool cut blazers & dinner jackets'
    },
    {
      name: 'Selvedge Denim Line',
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80',
      link: '/catalog?gender=men&category=Jeans',
      desc: 'Raw indigo denim crafted with classic fit'
    }
  ];

  const testimonials = [
    {
      quote: "ABespoke delivered an exquisite custom silk saree for my wedding reception. The measurement precision was flawless.",
      author: "Ananya Roy",
      role: "Couture Client",
      verified: true
    },
    {
      quote: "As a boutique owner, ABespoke expanded our reach to thousands of discerning buyers seeking authentic craftsmanship.",
      author: "Vivienne Atelier",
      role: "Boutique Partner",
      verified: true
    },
    {
      quote: "The designer verification badge gave our studio immediate credibility. Clients trust our lookbook collections implicitly.",
      author: "Prasannaraj Label",
      role: "Verified Designer",
      verified: true
    }
  ];

  return (
    <div className="space-y-24 font-sans pb-16 bg-[#F8F6F2] text-[#1F2937]">
      
      {/* 1. Cinematic Luxury Hero Section */}
      <div className="relative min-h-[90vh] w-full overflow-hidden bg-gray-950 flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
          alt="ABespoke Haute Couture Showcase"
          className="absolute inset-0 w-full h-full object-cover opacity-60 object-center transition-transform duration-[8000ms] hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/50 to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col justify-center space-y-8 text-white">
          <div className="space-y-5 max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-[#3A5040]/30 text-[#B8893D] border border-[#B8893D]/40 px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest font-sans backdrop-blur-md">
              AUTHENTIC LUXURY ATELIER
            </span>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-wide text-white">
              Couture Without <br />
              <span className="text-[#B8893D] italic font-light">Compromise.</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-light max-w-lg">
              Explore bespoke luxury garments from top fashion houses, verified designer labels, and master tailors. Precision fitting delivered directly to your doorstep.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/catalog"
              className="bg-[#3A5040] hover:bg-[#2d4033] text-white font-bold px-8 py-4 rounded-xl uppercase tracking-wider text-xs flex items-center gap-2.5 transition-all shadow-xl hover:shadow-2xl cursor-pointer"
            >
              <span>Explore Atelier Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/catalog?trending=true"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md font-bold px-7 py-4 rounded-xl uppercase tracking-wider text-xs transition-all cursor-pointer"
            >
              View Lookbook
            </Link>
          </div>
        </div>

        {/* Animated Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-300 text-[10px] uppercase tracking-widest animate-bounce">
          <span>Scroll To Discover</span>
          <ChevronDown className="w-4 h-4 text-[#B8893D]" />
        </div>
      </div>

      {/* 2. Curated Department Showcase */}
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8893D]">Haute Couture Department</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1F2937] tracking-wide">Curated Department Lines</h2>
          <p className="text-xs text-[#6B7280] font-light leading-relaxed">Discover hand-tailored luxury garments designed for grand celebrations, formal galas, and signature statements.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => navigate(cat.link)}
              className="glass-card glass-card-hover group cursor-pointer overflow-hidden p-3 flex flex-col space-y-4"
            >
              <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-[#F8F6F2] relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-[#1F2937]/80 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                  Atelier Choice
                </div>
              </div>
              
              <div className="px-2 pb-2 flex justify-between items-end">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-[#1F2937] group-hover:text-[#3A5040] transition-colors">{cat.name}</h3>
                  <p className="text-[11px] text-[#6B7280] font-light leading-snug">{cat.desc}</p>
                </div>
                <span className="text-[10px] text-[#B8893D] font-bold uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Shop <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Verified Designer Showcase */}
      {designers.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex justify-between items-end border-b border-[#ECE8E2] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8893D]">Verified Labels</span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1F2937]">Featured Designer Ateliers</h2>
            </div>
            <Link to="/catalog?category=Designers" className="text-xs font-bold uppercase tracking-wider text-[#3A5040] hover:text-[#1F2937] transition-colors flex items-center gap-1">
              <span>View All Designers</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {designers.map((d: any, idx: number) => (
              <div key={idx} className="bg-white border border-[#ECE8E2] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-[#1F2937]">{d.designerName || 'Couture Designer'}</h3>
                    <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
                  </div>
                  <p className="text-xs text-[#6B7280] font-light line-clamp-2 leading-relaxed">{d.about || 'Haute couture fashion designer specializing in custom fitting orders.'}</p>
                </div>

                <div className="pt-2 border-t border-[#ECE8E2] flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#B8893D] tracking-wider">
                    {Array.isArray(d.portfolioImages) ? d.portfolioImages.length : 0} Lookbook Works
                  </span>
                  <Link to="/catalog" className="text-xs font-bold text-[#3A5040] hover:underline">
                    View Portfolio →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Promotional Offer Banner */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-[#1F2937] via-[#2d3b4e] to-[#1F2937] text-white rounded-3xl p-8 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden border border-[#ECE8E2] shadow-2xl">
          <div className="space-y-4 max-w-xl z-10">
            <span className="inline-block bg-[#3A5040]/40 text-[#B8893D] border border-[#B8893D]/40 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Exclusive Privileges Offer
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
              Unlock Up To 30% Off <br />
              <span className="text-[#B8893D]">Bespoke Order Checkout</span>
            </h2>
            <p className="text-xs text-gray-300 font-light leading-relaxed">
              Use luxury promo codes during checkout. Enjoy complimentary Express delivery, premium packaging, and priority custom fitting support.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-sans pt-2">
              <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-xl font-mono">
                Code: <strong className="text-[#B8893D]">PREMIUM20</strong> (20% Off)
              </span>
              <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-xl font-mono">
                Code: <strong className="text-[#B8893D]">FESTIVE30</strong> (30% Off)
              </span>
            </div>
          </div>

          <div className="shrink-0 z-10">
            <button
              onClick={() => navigate('/catalog')}
              className="bg-[#3A5040] hover:bg-[#2d4033] text-white font-bold px-9 py-4 rounded-xl uppercase tracking-wider text-xs transition-all shadow-xl cursor-pointer"
            >
              Shop Atelier Collection
            </button>
          </div>
        </div>
      </div>

      {/* 5. Trending Drops */}
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8893D]">Curated Weekly</span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1F2937] tracking-wide">Trending Now</h2>
          </div>
          <Link to="/catalog?trending=true" className="text-xs font-bold uppercase tracking-wider text-[#3A5040] hover:text-[#1F2937] transition-colors flex items-center gap-1.5">
            <span>Explore All</span> <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer aspect-[3/4] rounded-2xl w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trending.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* 6. Testimonials Section */}
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8893D]">Client Stories</span>
          <h2 className="font-serif text-3xl font-bold text-[#1F2937]">What Our Atelier Clients Say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white border border-[#ECE8E2] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <Quote className="w-8 h-8 text-[#B8893D]/30" />
              <p className="text-xs text-[#1F2937] italic font-serif leading-relaxed">"{t.quote}"</p>
              <div className="pt-3 border-t border-[#ECE8E2] flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-[#1F2937]">{t.author}</h4>
                  <p className="text-[10px] text-[#6B7280]">{t.role}</p>
                </div>
                {t.verified && (
                  <span className="text-[9px] bg-emerald-50 text-[#16A34A] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Newsletter Subscription Card */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white border border-[#ECE8E2] rounded-3xl p-8 md:p-10 shadow-sm text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#F8F6F2] border border-[#ECE8E2] flex items-center justify-center text-[#3A5040] mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-[#1F2937]">Subscribe To Privileged Drops</h3>
            <p className="text-xs text-[#6B7280] font-light max-w-md mx-auto">Receive early access invitations to new lookbook launches, bespoke fitting events, and member discounts.</p>
          </div>

          {newsletterSubscribed ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-[#16A34A] max-w-md mx-auto">
              ✅ Thank you for subscribing! Check your inbox for exclusive invitation drops.
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 bg-[#F8F6F2] border border-[#ECE8E2] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#3A5040]"
              />
              <button
                type="submit"
                className="bg-[#3A5040] hover:bg-[#2d4033] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer shrink-0"
              >
                Join Privilege
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 8. Brand Assurances */}
      <div className="bg-white border-y border-[#ECE8E2] py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center text-center space-y-3 font-sans">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F6F2] border border-[#ECE8E2] flex items-center justify-center text-[#3A5040]">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1F2937]">Complimentary Express Transit</h3>
            <p className="text-xs text-[#6B7280] font-light max-w-xs leading-relaxed">
              Trackable express courier delivery on orders over Rs. 1,499 with insured tamper-proof packaging.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 font-sans">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F6F2] border border-[#ECE8E2] flex items-center justify-center text-[#3A5040]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1F2937]">15-Day Bespoke Guarantee</h3>
            <p className="text-xs text-[#6B7280] font-light max-w-xs leading-relaxed">
              Hassle-free doorstep return pick-up or size adjustment coordinate directly inside your dashboard.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 font-sans">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F6F2] border border-[#ECE8E2] flex items-center justify-center text-[#3A5040]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1F2937]">Verified Atelier Partners</h3>
            <p className="text-xs text-[#6B7280] font-light max-w-xs leading-relaxed">
              Every designer and boutique holds verified certification (`✓`) guaranteeing authentic luxury materials.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, Share2, Award, Clock, MapPin, Phone, Mail, 
  Star, Sparkles, User, Package, Briefcase 
} from 'lucide-react';
import { publicBoutiqueAPI } from '../services/api';

export const BoutiqueStorefront: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [boutique, setBoutique] = useState<any>(null);
  const [tailors, setTailors] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Storefront Tab
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'tailors' | 'portfolio'
  
  // Follower simulator state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    loadStorefront();
  }, [id]);

  const loadStorefront = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await publicBoutiqueAPI.getBoutiqueById(id);
      setBoutique(data.profile);
      setTailors(data.tailors || []);
      setPortfolio(data.portfolio || []);
      setProducts(data.products || []);
      setFollowerCount(data.profile.followersCount || 120);
    } catch (err) {
      console.error('Failed to load boutique storefront:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = () => {
    if (isFollowing) {
      setFollowerCount(prev => prev - 1);
    } else {
      setFollowerCount(prev => prev + 1);
    }
    setIsFollowing(!isFollowing);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans">
        <h2 className="font-serif text-xl font-bold text-luxury-dark uppercase tracking-wider">Boutique Not Found</h2>
        <p className="text-xs text-luxury-muted font-light">The requested seller portal does not exist or has not been verified yet.</p>
        <Link to="/" className="inline-block bg-luxury-dark hover:bg-neutral-800 text-white px-6 py-2.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans space-y-10">
      
      {/* cover banner header */}
      <div className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-md border border-neutral-100">
        <img 
          src={boutique.bannerUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600'} 
          alt="Boutique banner" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 flex flex-col justify-between p-6 md:p-8">
          <div className="flex justify-end gap-2">
            <button 
              onClick={handleFollowToggle}
              className={`px-4 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                isFollowing 
                  ? 'bg-luxury-gold text-white scale-105' 
                  : 'bg-white text-luxury-dark hover:bg-neutral-50'
              }`}
            >
              <Heart className={`w-3 h-3 ${isFollowing ? 'fill-white' : ''}`} />
              {isFollowing ? 'Following' : 'Follow Label'}
            </button>
            <button className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4 text-white">
              <img 
                src={boutique.logoUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400'} 
                alt="Logo" 
                className="w-16 h-16 rounded-full border-2 border-white object-cover shadow-md bg-white shrink-0" 
              />
              <div className="space-y-0.5">
                <span className="bg-luxury-gold text-white px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold font-sans">
                  Verified Label
                </span>
                <h1 className="font-serif text-xl md:text-2xl font-bold uppercase tracking-wider">{boutique.boutiqueName}</h1>
                <p className="text-xs font-light text-zinc-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {boutique.address || 'Mumbai Showroom'}
                </p>
              </div>
            </div>
            
            <div className="text-white text-right space-y-1 shrink-0 font-light text-xs sm:border-l sm:pl-6 sm:border-white/35">
              <p><strong>Followers:</strong> {followerCount} Fashion Lovers</p>
              <p><strong>Specializes in:</strong> {boutique.specialization || 'Traditional Wear'}</p>
              <p><strong>Experience:</strong> {boutique.experienceYears} Years Artisan Craft</p>
            </div>
          </div>
        </div>
      </div>

      {/* grid content story info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Story Bio */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-xl font-bold text-luxury-dark uppercase tracking-wide">Brand story</h2>
          <p className="text-xs text-neutral-600 font-light leading-relaxed font-sans">
            {boutique.about || 'Welcome to our premium boutique collection. Our artisans work to handcraft bespoke fashion pieces utilizing the finest fabrics, custom fits, and traditional embroidery patterns designed specifically to elevate your style.'}
          </p>
        </div>

        {/* Contacts details hours */}
        <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-6 space-y-4 text-xs font-sans shadow-sm">
          <h3 className="font-serif text-sm font-bold text-luxury-dark uppercase tracking-wider border-b border-neutral-150 pb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-luxury-gold" /> Boutique Information
          </h3>
          <div className="space-y-3 font-light text-neutral-600">
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-luxury-gold shrink-0" />
              <span><strong>Working Hours:</strong> {boutique.businessHours || '10:00 AM - 08:30 PM'}</span>
            </p>
            {boutique.contactNumber && (
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-luxury-gold shrink-0" />
                <span><strong>Phone Call:</strong> {boutique.contactNumber}</span>
              </p>
            )}
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-luxury-gold shrink-0" />
              <span><strong>Contact Email:</strong> {boutique.email || 'boutique@example.com'}</span>
            </p>
            <p className="flex items-center gap-2">
              <Award className="w-4 h-4 text-luxury-gold shrink-0" />
              <span><strong>Tailoring Standards:</strong> {boutique.pricingPolicy || 'Custom Fit & Premium Retail'}</span>
            </p>
          </div>
          
          {/* Socials */}
          <div className="flex gap-3 border-t border-neutral-100 pt-3.5">
            <a href="#" className="p-2 bg-white rounded-full border border-neutral-200 hover:text-luxury-gold transition-colors flex items-center justify-center">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.92-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="#" className="p-2 bg-white rounded-full border border-neutral-200 hover:text-luxury-gold transition-colors flex items-center justify-center">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="#" className="p-2 bg-white rounded-full border border-neutral-200 hover:text-luxury-gold transition-colors flex items-center justify-center">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 9.867 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Dynamic storefront tabs */}
      <div className="space-y-6">
        <div className="flex gap-4 border-b border-neutral-100 pb-2 text-[10px] font-semibold uppercase tracking-wider">
          {[
            { id: 'products', label: 'Boutique Collection', icon: Package },
            { id: 'tailors', label: 'Artisan Tailoring Team', icon: User },
            { id: 'portfolio', label: 'Previous Work Lookbook', icon: Briefcase }
          ].map((tab) => {
            const Icon = tab.icon;
            const isAct = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                  isAct
                    ? 'border-luxury-dark text-luxury-dark font-bold'
                    : 'border-transparent text-luxury-muted hover:text-luxury-dark'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-[40vh]">
          
          {/* COLLECTION PRODUCTS TAB */}
          {activeTab === 'products' && (
            products.length === 0 ? (
              <p className="text-luxury-muted font-light text-center py-12 font-sans">No products published in the storefront yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link 
                    key={product.id} 
                    to={`/products/${product.id}`} 
                    className="group flex flex-col bg-white border border-neutral-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-64 overflow-hidden relative">
                      <img 
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'} 
                        alt={product.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      {product.discount > 0 && (
                        <span className="absolute left-3 top-3 bg-luxury-dark text-white font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                          {product.discount}% Off
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between text-xs text-sans space-y-1.5">
                      <div>
                        <span className="text-[9px] text-luxury-muted uppercase font-bold tracking-wider">{product.brand}</span>
                        <h4 className="font-semibold text-luxury-dark group-hover:text-luxury-gold transition-colors truncate">{product.title}</h4>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-neutral-100">
                        <span className="font-bold text-luxury-dark text-xs font-sans">Rs. {product.price}</span>
                        <span className="text-[9px] text-emerald-600 font-bold uppercase">{product.stockStatus || 'In Stock'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {/* TAILORS TEAM TAB */}
          {activeTab === 'tailors' && (
            tailors.length === 0 ? (
              <p className="text-luxury-muted font-light text-center py-12 font-sans">Tailoring team information is currently being updated.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tailors.map((t) => (
                  <div key={t.id} className="border border-neutral-100 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col p-6 items-center text-center space-y-4">
                    <img 
                      src={t.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'} 
                      alt={t.name} 
                      className="w-20 h-20 rounded-full object-cover border-2 border-luxury-gold/20 shadow-sm" 
                    />
                    <div className="space-y-1">
                      <h4 className="font-serif text-base font-bold text-luxury-dark">{t.name}</h4>
                      <p className="text-luxury-gold font-bold uppercase tracking-wider text-[8px]">{t.specialization}</p>
                    </div>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-sm font-sans">{t.bio || 'Professional custom tailoring artisan.'}</p>
                    <div className="w-full border-t border-neutral-100 pt-3 flex justify-around text-[9px] text-neutral-500 font-light font-sans">
                      <p><strong>Experience:</strong> {t.experience}</p>
                      <div className="flex items-center gap-0.5 text-luxury-gold font-bold">
                        <Star className="w-3.5 h-3.5 fill-luxury-gold" /> {t.rating} / 5
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === 'portfolio' && (
            portfolio.length === 0 ? (
              <p className="text-luxury-muted font-light text-center py-12 font-sans">Lookbook design gallery is currently being curated.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {portfolio.map((p) => (
                  <div key={p.id} className="border border-neutral-100 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col group">
                    <div className="h-56 overflow-hidden">
                      <img 
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'} 
                        alt={p.designName} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                      />
                    </div>
                    <div className="p-4 flex-grow space-y-2 text-xs text-sans">
                      <div className="flex justify-between items-center">
                        <h4 className="font-serif text-sm font-bold text-luxury-dark">{p.designName}</h4>
                        <span className="bg-[#FAF9F6] text-luxury-gold px-2.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-neutral-500 font-light leading-relaxed font-sans">{p.description}</p>
                      <div className="border-t border-neutral-100 pt-2 grid grid-cols-2 gap-2 text-neutral-500 font-light font-sans">
                        <p><strong>Fabric:</strong> {p.fabric}</p>
                        <p><strong>Stitching:</strong> {p.stitchingType}</p>
                        <p className="col-span-2"><strong>Time Needed:</strong> {p.completionTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>

    </div>
  );
};
export default BoutiqueStorefront;

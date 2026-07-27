import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Package, ShoppingBag, ShieldAlert, Plus, Edit2, Trash2, 
  User, Copy, Calendar, Award, Briefcase, Search, Bell, CheckCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { boutiqueAPI, adminAPI, productsAPI } from '../services/api';
import ImageUpload from '../components/ImageUpload';

export const BoutiqueDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); 
  const [profile, setProfile] = useState<any>({
    boutiqueName: '',
    logoUrl: '',
    bannerUrl: '',
    about: '',
    address: '',
    contactNumber: '',
    email: '',
    socialLinks: { instagram: '', facebook: '', twitter: '' },
    businessHours: '',
    experienceYears: 0,
    specialization: '',
    verified: false,
    deliveryOptions: '',
    pricingPolicy: '',
    followersCount: 0
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tailors, setTailors] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [hiring, setHiring] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [prodSearch, setProdSearch] = useState('');
  const [prodFilter, setProdFilter] = useState('all'); // 'all' | 'active' | 'paused' | 'out_of_stock'
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'order' | 'inventory' | 'customer' | 'tailor'
  const [notifSearch, setNotifSearch] = useState('');

  // Dialog/Form Toggles
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showTailorForm, setShowTailorForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [showHiringForm, setShowHiringForm] = useState(false);

  // Form payloads
  const [productPayload, setProductPayload] = useState({
    title: '',
    brand: '',
    category: 'Sarees',
    gender: 'women' as 'men' | 'women',
    price: '',
    discount: '0',
    stock: '',
    fabric: 'Silk',
    fit: 'Regular Fit',
    occasion: 'Festive',
    pattern: 'Solid',
    description: '',
    images: [] as string[],
    sku: '',
    deliveryTime: '3-5 Days',
    careInstructions: 'Dry Clean Only',
    returnPolicy: '7 Days Returns Allowed',
    paused: false,
    stockStatus: 'in_stock' as const
  });

  const [tailorPayload, setTailorPayload] = useState({
    name: '',
    photoUrl: '',
    experience: '5 Years',
    specialization: 'Custom Blouse & Lehenga Stitching',
    certifications: '',
    workingHours: '09:00 AM - 06:00 PM',
    languages: 'English, Hindi',
    bio: '',
    projectsCount: '150'
  });

  const [portfolioPayload, setPortfolioPayload] = useState({
    designName: '',
    category: 'Lehenga',
    description: '',
    fabric: 'Velvet',
    stitchingType: 'Bespoke Custom Stitch',
    completionTime: '5 Days',
    images: [] as string[],
    customerReview: ''
  });

  const [hiringPayload, setHiringPayload] = useState({
    title: 'Senior Master Tailor Wanted',
    skills: 'Pattern cutting, heavy embroidery hand stitching',
    experience: '5+ Years',
    employmentType: 'Full-time',
    salaryRange: '25,000 - 35,000 INR Monthly',
    location: 'Mumbai Boutique Store',
    vacancies: '1',
    closingDate: '2026-08-31'
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'boutique') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Profile
      const prof = await boutiqueAPI.getProfile();
      setProfile(prof);

      // Tailors
      const ts = await boutiqueAPI.getTailors();
      setTailors(ts);

      // Portfolios
      const ports = await boutiqueAPI.getPortfolio();
      setPortfolio(ports);

      // Hiring requirement posts
      const hr = await boutiqueAPI.getHiring();
      setHiring(hr);

      // Notifications
      const notifs = await boutiqueAPI.getNotifications();
      setNotifications(notifs);

      // Orders
      const ords = await boutiqueAPI.getOrders();
      setOrders(ords);


      
      // Filter products belonging to this boutique brand
      const allProds = await productsAPI.getProducts({});
      const boutiqueProds = allProds.filter((p: any) => p.brand.toLowerCase() === prof.boutiqueName.toLowerCase());
      setProducts(boutiqueProds);
    } catch (err) {
      console.error('Failed to load Boutique Seller Portal details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await boutiqueAPI.updateProfile(profile);
      setProfile(updated);
      alert('Boutique Seller Profile details updated successfully.');
    } catch (err) {
      alert('Failed to update boutique details.');
    }
  };

  // Tailor Creation
  const handleTailorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payloadData = {
        ...tailorPayload,
        certifications: tailorPayload.certifications.split(',').map(s => s.trim()),
        languages: tailorPayload.languages.split(',').map(s => s.trim()),
        projectsCount: Number(tailorPayload.projectsCount)
      };
      await boutiqueAPI.addTailor(payloadData);
      setShowTailorForm(false);
      loadData();
      alert('Tailor profile added successfully.');
    } catch (err) {
      alert('Failed to add tailor.');
    }
  };

  const handleDeleteTailor = async (id: string) => {
    if (window.confirm('Delete this tailor record?')) {
      await boutiqueAPI.deleteTailor(id);
      loadData();
    }
  };

  // Portfolio Creation
  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payloadData = {
        ...portfolioPayload,
        images: portfolioPayload.images
      };
      await boutiqueAPI.addPortfolio(payloadData);
      setShowPortfolioForm(false);
      loadData();
      alert('Portfolio lookbook design added.');
    } catch (err) {
      alert('Failed to add portfolio lookbook.');
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (window.confirm('Delete this portfolio item?')) {
      await boutiqueAPI.deletePortfolio(id);
      loadData();
    }
  };

  // Hiring requirements
  const handleHiringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payloadData = {
        ...hiringPayload,
        skills: hiringPayload.skills.split(',').map(s => s.trim())
      };
      await boutiqueAPI.addHiring(payloadData);
      setShowHiringForm(false);
      loadData();
      alert('Hiring requirement posted successfully.');
    } catch (err) {
      alert('Failed to post vacancy.');
    }
  };

  const handleDeleteHiring = async (id: string) => {
    if (window.confirm('Remove this vacancy post?')) {
      await boutiqueAPI.deleteHiring(id);
      loadData();
    }
  };

  // Notifications Actions
  const handleMarkRead = async (id: string) => {
    await boutiqueAPI.markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await boutiqueAPI.markAllNotificationsRead();
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = async (id: string) => {
    await boutiqueAPI.deleteNotification(id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Product CRUD
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalPayload = {
        ...productPayload,
        price: Number(productPayload.price),
        discount: Number(productPayload.discount),
        stock: Number(productPayload.stock),
        images: productPayload.images.length > 0 ? productPayload.images : ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600']
      };

      if (editingProductId) {
        await adminAPI.updateProduct(editingProductId, finalPayload);
        alert('Product modified successfully.');
      } else {
        await adminAPI.createProduct(finalPayload);
        alert('Product published successfully.');
      }
      setShowProductForm(false);
      setEditingProductId(null);
      loadData();
    } catch (err) {
      alert('Failed to publish product listing.');
    }
  };

  const handleEditProduct = (prod: any) => {
    setEditingProductId(prod.id);
    setProductPayload({
      title: prod.title,
      brand: prod.brand,
      category: prod.category,
      gender: prod.gender,
      price: String(prod.price),
      discount: String(prod.discount),
      stock: String(prod.stock),
      fabric: prod.fabric || '',
      fit: prod.fit || '',
      occasion: prod.occasion || '',
      pattern: prod.pattern || '',
      description: prod.description || '',
      images: prod.images || [],
      sku: prod.sku || `SKU_${Date.now().toString().substring(8)}`,
      deliveryTime: prod.deliveryTime || '3-5 Days',
      careInstructions: prod.careInstructions || 'Dry Clean Only',
      returnPolicy: prod.returnPolicy || '7 Days Returns Allowed',
      paused: prod.paused || false,
      stockStatus: prod.stockStatus || 'in_stock'
    });
    setShowProductForm(true);
  };

  const handleDuplicateProduct = async (prod: any) => {
    try {
      const duplicatePayload = {
        ...prod,
        id: undefined,
        title: `Copy of ${prod.title}`,
        sku: `${prod.sku || 'SKU'}_COPY`,
        createdAt: new Date().toISOString()
      };
      await adminAPI.createProduct(duplicatePayload);
      loadData();
      alert('Product duplicated successfully.');
    } catch (err) {
      alert('Failed to duplicate listing.');
    }
  };

  const handleTogglePauseProduct = async (prod: any) => {
    try {
      const updated = { ...prod, paused: !prod.paused };
      await adminAPI.updateProduct(prod.id, updated);
      loadData();
      alert(prod.paused ? 'Listing activated.' : 'Listing paused.');
    } catch (err) {
      alert('Failed to toggle pause status.');
    }
  };

  const handleStockStatusChange = async (prod: any, status: any) => {
    try {
      const updated = { ...prod, stockStatus: status };
      await adminAPI.updateProduct(prod.id, updated);
      loadData();
      alert(`Stock status changed to ${status}`);
    } catch (err) {
      alert('Failed to change stock status.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      await adminAPI.deleteProduct(id);
      loadData();
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await boutiqueAPI.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
      alert(`Order status transitioned to ${newStatus}`);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Filtering helpers
  const getFilteredProducts = () => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(prodSearch.toLowerCase()) || p.category.toLowerCase().includes(prodSearch.toLowerCase());
      if (prodFilter === 'all') return matchesSearch;
      if (prodFilter === 'active') return matchesSearch && !p.paused;
      if (prodFilter === 'paused') return matchesSearch && p.paused;
      if (prodFilter === 'out_of_stock') return matchesSearch && p.stock <= 0;
      return matchesSearch;
    });
  };

  const getFilteredNotifications = () => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(notifSearch.toLowerCase()) || n.message.toLowerCase().includes(notifSearch.toLowerCase());
      const matchesType = notifFilter === 'all' || n.type === notifFilter;
      return matchesSearch && matchesType;
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Analytics helper metrics
  const activeProducts = products.filter(p => !p.paused).length;
  const outOfStockProducts = products.filter(p => p.stock <= 0).length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'Placed' || o.orderStatus === 'Shipped').length;
  const completedOrders = orders.filter(o => o.orderStatus === 'Delivered').length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.orderStatus === 'Delivered' ? o.summary.total : 0), 0);
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans space-y-8">
      
      {/* Cover Banner Area */}
      {profile.bannerUrl ? (
        <div className="h-48 md:h-64 rounded-3xl overflow-hidden relative shadow-md">
          <img src={profile.bannerUrl} alt="Boutique Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-end p-6 md:p-8">
            <div className="flex items-center gap-4 text-white">
              {profile.logoUrl && (
                <img src={profile.logoUrl} alt="Logo" className="w-16 h-16 rounded-full border-2 border-white object-cover shadow-lg" />
              )}
              <div>
                <h1 className="font-serif text-2xl md:text-3.5xl font-bold uppercase tracking-wider">{profile.boutiqueName}</h1>
                <p className="text-xs font-light text-zinc-200 mt-1">{profile.specialization} Showcase • Mumbai</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-luxury-cream border border-[#EBE6DC] rounded-3xl p-8 flex items-center gap-6 relative shadow-sm">
          {profile.logoUrl && (
            <img src={profile.logoUrl} alt="Logo" className="w-20 h-20 rounded-full border object-cover shadow" />
          )}
          <div>
            <h1 className="font-serif text-3xl font-bold text-luxury-dark uppercase tracking-wide">{profile.boutiqueName}</h1>
            <p className="text-xs text-luxury-muted mt-1 font-light">{profile.specialization || 'Premium Tailoring Boutique'}</p>
          </div>
        </div>
      )}

      {/* Verification Warning Banner */}
      {!profile.verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4 text-amber-800 shadow-sm leading-relaxed">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 font-sans">
            <h4 className="font-bold uppercase tracking-wider text-[10px]">Verification Pending Approval</h4>
            <p className="font-light">
              Your Boutique Seller Account is currently under review. Publishings and orders management are fully functional for testing, but listing status approvals are monitored.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 pb-2 text-xs font-semibold uppercase tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'overview', label: 'Boutique Overview', icon: BarChart3 },
          { id: 'profile', label: 'Boutique Profile', icon: User },
          { id: 'tailors', label: 'Tailors Team', icon: Award },
          { id: 'portfolio', label: 'Work Portfolio', icon: Briefcase },
          { id: 'inventory', label: 'Products Inventory', icon: Package },
          { id: 'orders', label: 'Client Orders', icon: ShoppingBag },
          { id: 'hiring', label: 'Recruitment Panel', icon: Calendar },
          { id: 'notifications', label: `Notifications (${unreadNotifCount})`, icon: Bell }
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
              <Icon className="w-4.5 h-4.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels */}
      <div className="min-h-[50vh] bg-white border border-[#EBE6DC] rounded-3xl p-6 lg:p-8 shadow-sm">
        
        {/* OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-luxury-muted">Active Listings</span>
                <p className="text-2xl font-bold text-luxury-dark">{activeProducts}</p>
              </div>
              <div className="bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-luxury-muted">Out of Stock</span>
                <p className="text-2xl font-bold text-red-500">{outOfStockProducts}</p>
              </div>
              <div className="bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-luxury-muted">Pending Shipments</span>
                <p className="text-2xl font-bold text-luxury-dark">{pendingOrders}</p>
              </div>
              <div className="bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-luxury-muted">Completed Orders</span>
                <p className="text-2xl font-bold text-luxury-dark">{completedOrders}</p>
              </div>
              <div className="bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-luxury-muted">Revenue Generated</span>
                <p className="text-2xl font-bold text-green-600">Rs. {totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Pure SVG Bar Chart (zero external dependencies, compiles natively in strict TS) */}
            <div className="border border-[#EBE6DC] rounded-2xl p-6 space-y-4">
              <h3 className="font-serif text-base font-bold text-luxury-dark uppercase tracking-wider">Monthly Revenue Analytics</h3>
              <div className="w-full h-48 flex items-end justify-between gap-2.5 pt-6 relative border-b border-zinc-200">
                
                {/* SVG Bar chart */}
                <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="400" y2="20" stroke="#f4f4f4" strokeWidth="1" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#f4f4f4" strokeWidth="1" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#f4f4f4" strokeWidth="1" />
                  
                  {/* Bars */}
                  {[
                    { label: 'Jan', val: 40 },
                    { label: 'Feb', val: 55 },
                    { label: 'Mar', val: 75 },
                    { label: 'Apr', val: 60 },
                    { label: 'May', val: 90 },
                    { label: 'Jun', val: 110 }
                  ].map((d, i) => {
                    const x = 30 + i * 60;
                    const height = d.val;
                    const y = 120 - height;
                    return (
                      <g key={i}>
                        {/* Bar */}
                        <rect x={x} y={y} width="24" height={height} fill="#141416" rx="4" className="hover:fill-luxury-gold transition-colors duration-300" />
                        {/* Text Label */}
                        <text x={x + 12} y="115" fontSize="7" fill="#8C8273" textAnchor="middle" fontWeight="bold">{d.label}</text>
                        {/* Text Value */}
                        <text x={x + 12} y={y - 5} fontSize="6.5" fill="#141416" textAnchor="middle">{d.val * 1000}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Quick Profile Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#EBE6DC] rounded-2xl p-6 space-y-3 text-xs text-sans bg-[#FAF8F5]">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-luxury-gold">Boutique Contact Info</h4>
                <p><strong>Support Email:</strong> {profile.email || 'boutique@example.com'}</p>
                <p><strong>Mobile/Phone:</strong> {profile.contactNumber || 'Not configured'}</p>
                <p><strong>Business Hours:</strong> {profile.businessHours || '10:00 AM - 08:30 PM'}</p>
                <p><strong>Years Established:</strong> {profile.experienceYears} Years</p>
              </div>
              <div className="border border-[#EBE6DC] rounded-2xl p-6 space-y-3 text-xs text-sans bg-[#FAF8F5]">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-luxury-gold">Active Team Statistics</h4>
                <p><strong>Registered Tailors:</strong> {tailors.length} Custom Masters</p>
                <p><strong>Lookbooks Uploaded:</strong> {portfolio.length} Stitch Designs</p>
                <p><strong>Tailor Vacancies Posted:</strong> {hiring.length} Hiring Posts</p>
                <p><strong>Verification State:</strong> {profile.verified ? 'Verified Label' : 'Review Pending'}</p>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6 text-xs font-sans max-w-3xl">
            <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider border-b pb-2">Boutique Seller Profile Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Boutique Brand Name</label>
                <input
                  type="text"
                  required
                  value={profile.boutiqueName}
                  onChange={(e) => setProfile({ ...profile, boutiqueName: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Contact Mobile Phone</label>
                <input
                  type="text"
                  value={profile.contactNumber}
                  onChange={(e) => setProfile({ ...profile, contactNumber: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <ImageUpload
                  label="Logo Image"
                  value={profile.logoUrl}
                  onChange={(url) => setProfile({ ...profile, logoUrl: url })}
                />
              </div>
              <div className="space-y-1">
                <ImageUpload
                  label="Banner Cover Image"
                  value={profile.bannerUrl}
                  onChange={(url) => setProfile({ ...profile, bannerUrl: url })}
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Specialization Focus</label>
                <select
                  value={profile.specialization}
                  onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                >
                  <option value="Bridal & Party Wear">Bridal & Party Wear</option>
                  <option value="Traditional Wear">Traditional Wear</option>
                  <option value="Casual & Fusion">Casual & Fusion Wear</option>
                  <option value="Indo-Western Haute Couture">Indo-Western Haute Couture</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Years of Experience</label>
                <input
                  type="number"
                  value={profile.experienceYears}
                  onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Store Business Hours</label>
                <input
                  type="text"
                  value={profile.businessHours}
                  onChange={(e) => setProfile({ ...profile, businessHours: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                  placeholder="e.g. 10:00 AM - 08:30 PM"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Logistics Carriers</label>
                <input
                  type="text"
                  value={profile.deliveryOptions}
                  onChange={(e) => setProfile({ ...profile, deliveryOptions: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Instagram Link</label>
                <input
                  type="text"
                  value={profile.socialLinks?.instagram || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, instagram: e.target.value } })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Facebook Link</label>
                <input
                  type="text"
                  value={profile.socialLinks?.facebook || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, facebook: e.target.value } })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Twitter Link</label>
                <input
                  type="text"
                  value={profile.socialLinks?.twitter || ''}
                  onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, twitter: e.target.value } })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-luxury-muted">Store Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
              />
            </div>
            
            <div className="space-y-1">
              <label className="font-bold text-luxury-muted">Brand Story Bio</label>
              <textarea
                rows={3}
                value={profile.about}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
              />
            </div>

            <button
              type="submit"
              className="bg-luxury-dark hover:bg-luxury-gold text-white font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow transition-all duration-300"
            >
              Save Boutique Profile Details
            </button>
          </form>
        )}

        {/* TAILORS TEAM TAB */}
        {activeTab === 'tailors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider">Tailors Team Showcase</h3>
              <button
                onClick={() => setShowTailorForm(!showTailorForm)}
                className="bg-luxury-dark hover:bg-luxury-gold text-white font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Team Tailor
              </button>
            </div>

            {/* Add Tailor Form */}
            {showTailorForm && (
              <form onSubmit={handleTailorSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans p-5 bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl">
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Tailor Name</label>
                  <input
                    type="text"
                    required
                    value={tailorPayload.name}
                    onChange={(e) => setTailorPayload({ ...tailorPayload, name: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <ImageUpload
                    label="Tailor Photo"
                    value={tailorPayload.photoUrl}
                    onChange={(url) => setTailorPayload({ ...tailorPayload, photoUrl: url })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Experience Years</label>
                  <input
                    type="text"
                    value={tailorPayload.experience}
                    onChange={(e) => setTailorPayload({ ...tailorPayload, experience: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Specialization Focus</label>
                  <input
                    type="text"
                    value={tailorPayload.specialization}
                    onChange={(e) => setTailorPayload({ ...tailorPayload, specialization: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={tailorPayload.languages}
                    onChange={(e) => setTailorPayload({ ...tailorPayload, languages: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Certifications (comma separated)</label>
                  <input
                    type="text"
                    value={tailorPayload.certifications}
                    onChange={(e) => setTailorPayload({ ...tailorPayload, certifications: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="font-bold text-luxury-muted">Short Biography</label>
                  <textarea
                    rows={2}
                    value={tailorPayload.bio}
                    onChange={(e) => setTailorPayload({ ...tailorPayload, bio: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTailorForm(false)}
                    className="border border-[#EBE6DC] px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-luxury-dark hover:bg-luxury-gold text-white px-6 py-2 rounded-xl"
                  >
                    Save Tailor
                  </button>
                </div>
              </form>
            )}

            {/* List Tailors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tailors.map((t) => (
                <div key={t.id} className="border border-[#EBE6DC] rounded-2xl overflow-hidden shadow-sm hover:shadow bg-[#FAF8F5] relative flex flex-col">
                  <button
                    onClick={() => handleDeleteTailor(t.id)}
                    className="absolute right-4 top-4 bg-white/80 p-1.5 rounded-full text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="h-44 overflow-hidden">
                    <img src={t.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 flex-grow space-y-3 text-xs font-sans">
                    <h4 className="font-serif text-base font-bold text-luxury-dark">{t.name}</h4>
                    <p className="text-luxury-gold font-bold uppercase tracking-wider text-[9px]">{t.specialization}</p>
                    <p className="text-zinc-600 leading-relaxed font-light">{t.bio || 'Tailoring team specialist.'}</p>
                    
                    <div className="border-t pt-2 space-y-1.5 font-light text-zinc-500">
                      <p><strong>Experience:</strong> {t.experience}</p>
                      <p><strong>Certifications:</strong> {t.certifications?.join(', ') || 'Tailoring Certificate'}</p>
                      <p><strong>Languages:</strong> {t.languages?.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORK PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider">Previous Work Lookbook</h3>
              <button
                onClick={() => setShowPortfolioForm(!showPortfolioForm)}
                className="bg-luxury-dark hover:bg-luxury-gold text-white font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Lookbook Item
              </button>
            </div>

            {/* Add Portfolio Form */}
            {showPortfolioForm && (
              <form onSubmit={handlePortfolioSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans p-5 bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl">
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Design Name</label>
                  <input
                    type="text"
                    required
                    value={portfolioPayload.designName}
                    onChange={(e) => setPortfolioPayload({ ...portfolioPayload, designName: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Design Category</label>
                  <input
                    type="text"
                    required
                    value={portfolioPayload.category}
                    onChange={(e) => setPortfolioPayload({ ...portfolioPayload, category: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Fabric Material Used</label>
                  <input
                    type="text"
                    value={portfolioPayload.fabric}
                    onChange={(e) => setPortfolioPayload({ ...portfolioPayload, fabric: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Stitching Type</label>
                  <input
                    type="text"
                    value={portfolioPayload.stitchingType}
                    onChange={(e) => setPortfolioPayload({ ...portfolioPayload, stitchingType: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Completion Time</label>
                  <input
                    type="text"
                    value={portfolioPayload.completionTime}
                    onChange={(e) => setPortfolioPayload({ ...portfolioPayload, completionTime: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <ImageUpload
                    label="Design Images"
                    multiple={true}
                    value={portfolioPayload.images}
                    onChange={(urls) => setPortfolioPayload({ ...portfolioPayload, images: urls })}
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="font-bold text-luxury-muted">Design Description</label>
                  <textarea
                    rows={2}
                    value={portfolioPayload.description}
                    onChange={(e) => setPortfolioPayload({ ...portfolioPayload, description: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPortfolioForm(false)}
                    className="border border-[#EBE6DC] px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-luxury-dark hover:bg-luxury-gold text-white px-6 py-2 rounded-xl"
                  >
                    Publish Look
                  </button>
                </div>
              </form>
            )}

            {/* Gallery lookbook items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {portfolio.map((p) => (
                <div key={p.id} className="border border-[#EBE6DC] rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col relative group">
                  <button
                    onClick={() => handleDeletePortfolio(p.id)}
                    className="absolute right-4 top-4 bg-white/80 p-1.5 rounded-full text-red-500 hover:bg-red-50 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="h-56 overflow-hidden">
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'} alt={p.designName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="p-4 flex-grow space-y-2.5 text-xs text-sans">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif text-sm font-bold text-luxury-dark">{p.designName}</h4>
                      <span className="bg-luxury-cream text-luxury-gold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-zinc-500 font-light leading-relaxed">{p.description}</p>
                    <div className="border-t pt-2 grid grid-cols-2 gap-2 text-zinc-500 font-light">
                      <p><strong>Fabric:</strong> {p.fabric}</p>
                      <p><strong>Stitching:</strong> {p.stitchingType}</p>
                      <p className="col-span-2"><strong>Completed in:</strong> {p.completionTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVENTORY PANEL */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
              <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider">Catalog Showcase</h3>
              <div className="flex gap-2 text-xs">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search catalog..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="border border-[#EBE6DC] rounded-xl pl-8 pr-4 py-2 bg-[#FAF8F5]"
                  />
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-luxury-muted" />
                </div>
                <select
                  value={prodFilter}
                  onChange={(e) => setProdFilter(e.target.value)}
                  className="border border-[#EBE6DC] rounded-xl p-2 bg-[#FAF8F5]"
                >
                  <option value="all">All Styles</option>
                  <option value="active">Active listings</option>
                  <option value="paused">Paused listings</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
                <button
                  onClick={() => {
                    setShowProductForm(true);
                    setEditingProductId(null);
                    setProductPayload({
                      title: '',
                      brand: profile.boutiqueName || 'My Boutique',
                      category: 'Sarees',
                      gender: 'women',
                      price: '',
                      discount: '0',
                      stock: '',
                      fabric: 'Silk',
                      fit: 'Regular Fit',
                      occasion: 'Festive',
                      pattern: 'Solid',
                      description: '',
                      images: [],
                      sku: `SKU_${Date.now().toString().substring(8)}`,
                      deliveryTime: '3-5 Days',
                      careInstructions: 'Dry Clean Only',
                      returnPolicy: '7 Days Returns Allowed',
                      paused: false,
                      stockStatus: 'in_stock'
                    });
                  }}
                  className="bg-luxury-dark hover:bg-luxury-gold text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Style
                </button>
              </div>
            </div>

            {/* Add / Edit product form */}
            {showProductForm && (
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans p-5 bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl">
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Style Title</label>
                  <input
                    type="text"
                    required
                    value={productPayload.title}
                    onChange={(e) => setProductPayload({ ...productPayload, title: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Boutique Brand Label</label>
                  <input
                    type="text"
                    required
                    value={productPayload.brand}
                    onChange={(e) => setProductPayload({ ...productPayload, brand: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Category Department</label>
                  <select
                    required
                    value={productPayload.category}
                    onChange={(e) => setProductPayload({ ...productPayload, category: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  >
                    <option value="Sarees">Sarees</option>
                    <option value="Lehengas">Lehengas</option>
                    <option value="Kurtis">Kurtis</option>
                    <option value="Half Sarees">Half Sarees</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Shirts">Shirts</option>
                    <option value="Pants">Pants</option>
                    <option value="Blazers">Blazers</option>
                    <option value="Jeans">Jeans</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={productPayload.price}
                    onChange={(e) => setProductPayload({ ...productPayload, price: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productPayload.stock}
                    onChange={(e) => setProductPayload({ ...productPayload, stock: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Item SKU Code</label>
                  <input
                    type="text"
                    required
                    value={productPayload.sku}
                    onChange={(e) => setProductPayload({ ...productPayload, sku: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Care Instructions</label>
                  <input
                    type="text"
                    value={productPayload.careInstructions}
                    onChange={(e) => setProductPayload({ ...productPayload, careInstructions: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Return Policy</label>
                  <input
                    type="text"
                    value={productPayload.returnPolicy}
                    onChange={(e) => setProductPayload({ ...productPayload, returnPolicy: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Stitch Delivery Time</label>
                  <input
                    type="text"
                    value={productPayload.deliveryTime}
                    onChange={(e) => setProductPayload({ ...productPayload, deliveryTime: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <ImageUpload
                    label="Product Images"
                    multiple={true}
                    value={productPayload.images}
                    onChange={(urls) => setProductPayload({ ...productPayload, images: urls })}
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="font-bold text-luxury-muted">Style Description</label>
                  <textarea
                    required
                    rows={2}
                    value={productPayload.description}
                    onChange={(e) => setProductPayload({ ...productPayload, description: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="border border-[#EBE6DC] px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-luxury-dark hover:bg-luxury-gold text-white px-6 py-2 rounded-xl"
                  >
                    {editingProductId ? 'Save Style Changes' : 'Publish Style Listing'}
                  </button>
                </div>
              </form>
            )}

            {/* List products */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#EBE6DC] text-left text-xs text-sans">
                <thead>
                  <tr className="bg-[#FAF8F5]">
                    <th className="p-3 border border-[#EBE6DC]">Style</th>
                    <th className="p-3 border border-[#EBE6DC]">SKU</th>
                    <th className="p-3 border border-[#EBE6DC]">Category</th>
                    <th className="p-3 border border-[#EBE6DC]">Price</th>
                    <th className="p-3 border border-[#EBE6DC]">Stock</th>
                    <th className="p-3 border border-[#EBE6DC]">Stock Status</th>
                    <th className="p-3 border border-[#EBE6DC]">State</th>
                    <th className="p-3 border border-[#EBE6DC] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE6DC]">
                  {getFilteredProducts().map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'} alt="Icon" className="w-10 h-10 object-cover rounded-lg border" />
                          <div>
                            <span className="font-semibold text-luxury-dark block">{p.title}</span>
                            <span className="text-[10px] text-luxury-muted uppercase">{p.fabric}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[10px]">{p.sku || 'N/A'}</td>
                      <td className="p-3 uppercase font-medium">{p.category}</td>
                      <td className="p-3">Rs. {p.price}</td>
                      <td className="p-3 font-bold">{p.stock} units</td>
                      <td className="p-3">
                        <select
                          value={p.stockStatus || 'in_stock'}
                          onChange={(e) => handleStockStatusChange(p, e.target.value)}
                          className="bg-white border rounded p-1 text-[10px] uppercase font-bold"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="limited_stock">Limited Stock</option>
                          <option value="available_soon">Available Soon</option>
                          <option value="discontinued">Discontinued</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleTogglePauseProduct(p)}
                          className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                            p.paused
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-green-50 text-green-600 border border-green-200'
                          }`}
                        >
                          {p.paused ? 'Paused' : 'Active'}
                        </button>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleDuplicateProduct(p)}
                          className="p-1.5 border border-zinc-200 rounded-lg hover:border-luxury-gold hover:text-luxury-gold"
                          title="Duplicate listing"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="p-1.5 border border-zinc-200 rounded-lg hover:border-luxury-gold hover:text-luxury-gold"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 border border-zinc-200 rounded-lg hover:border-red-50 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLIENT ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider border-b pb-2">Client Orders Tracker</h3>
            {orders.length === 0 ? (
              <p className="text-luxury-muted font-light text-center py-10">No orders placed yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="border border-[#EBE6DC] rounded-2xl p-5 bg-[#FAF8F5] space-y-4 text-xs font-sans">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#EBE6DC]/60 pb-3 gap-2">
                      <div>
                        <span className="font-bold text-luxury-dark text-sm uppercase">Order #{o.id}</span>
                        <p className="text-[10px] text-luxury-muted mt-0.5">Placed on: {new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-luxury-muted">Status:</span>
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                          className="bg-white border rounded p-1.5 font-bold uppercase tracking-wider text-[9px]"
                        >
                          <option value="Placed">Placed</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-[#EBE6DC]/40">
                      {o.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4 py-3 first:pt-0 last:pb-0 items-center">
                          <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover border" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-luxury-dark text-xs">{item.title}</h4>
                            <p className="text-[10px] text-luxury-muted uppercase">{item.brand} | Size: {item.size} | Color: {item.color}</p>
                          </div>
                          <span className="font-medium text-luxury-dark">Qty: {item.quantity}</span>
                          <span className="font-bold text-luxury-dark">Rs. {item.price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between border-t border-[#EBE6DC]/60 pt-3 font-semibold text-luxury-dark">
                      <span>Total Amount:</span>
                      <span>Rs. {o.summary.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECRUITMENT PANEL */}
        {activeTab === 'hiring' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider">Hiring requirements desk</h3>
              <button
                onClick={() => setShowHiringForm(!showHiringForm)}
                className="bg-luxury-dark hover:bg-luxury-gold text-white font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Post Vacancy
              </button>
            </div>

            {/* Add vacancy Form */}
            {showHiringForm && (
              <form onSubmit={handleHiringSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans p-5 bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl">
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Job Title</label>
                  <input
                    type="text"
                    required
                    value={hiringPayload.title}
                    onChange={(e) => setHiringPayload({ ...hiringPayload, title: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Experience Required</label>
                  <input
                    type="text"
                    required
                    value={hiringPayload.experience}
                    onChange={(e) => setHiringPayload({ ...hiringPayload, experience: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Employment Type</label>
                  <select
                    value={hiringPayload.employmentType}
                    onChange={(e) => setHiringPayload({ ...hiringPayload, employmentType: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract Basis">Contract Basis</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Salary Range</label>
                  <input
                    type="text"
                    value={hiringPayload.salaryRange}
                    onChange={(e) => setHiringPayload({ ...hiringPayload, salaryRange: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Location Details</label>
                  <input
                    type="text"
                    value={hiringPayload.location}
                    onChange={(e) => setHiringPayload({ ...hiringPayload, location: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Vacancies Count</label>
                  <input
                    type="number"
                    value={hiringPayload.vacancies}
                    onChange={(e) => setHiringPayload({ ...hiringPayload, vacancies: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="font-bold text-luxury-muted">Required Skills (comma separated)</label>
                  <input
                    type="text"
                    value={hiringPayload.skills}
                    onChange={(e) => setHiringPayload({ ...hiringPayload, skills: e.target.value })}
                    className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHiringForm(false)}
                    className="border border-[#EBE6DC] px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-luxury-dark hover:bg-luxury-gold text-white px-6 py-2 rounded-xl"
                  >
                    Post Hiring requirements
                  </button>
                </div>
              </form>
            )}

            {/* List postings */}
            <div className="space-y-4">
              {hiring.map((h) => (
                <div key={h.id} className="border border-[#EBE6DC] rounded-2xl p-5 bg-[#FAF8F5] flex flex-col sm:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-2">
                    <h4 className="font-serif text-base font-bold text-luxury-dark">{h.title}</h4>
                    <p className="text-luxury-gold font-bold uppercase tracking-wider text-[9px]">Location: {h.location} | Vacancies: {h.vacancies}</p>
                    <div className="flex flex-wrap gap-1">
                      {h.skills?.map((sk: string, idx: number) => (
                        <span key={idx} className="bg-white border border-zinc-200 px-2 py-0.5 rounded text-[9px]">
                          {sk}
                        </span>
                      ))}
                    </div>
                    <p className="text-zinc-500 font-light">Experience Required: {h.experience} • Type: {h.employmentType} • Salary: {h.salaryRange}</p>
                  </div>
                  <div className="flex sm:flex-col justify-end items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleDeleteHiring(h.id)}
                      className="border border-red-200 text-red-500 hover:bg-red-50 px-3.5 py-1.5 rounded-xl uppercase tracking-wider font-bold text-[9px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS PANEL */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4">
              <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider">Alert Center</h3>
              
              <div className="flex gap-2 text-xs">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={notifSearch}
                    onChange={(e) => setNotifSearch(e.target.value)}
                    className="border border-[#EBE6DC] rounded-xl pl-8 pr-4 py-2 bg-[#FAF8F5]"
                  />
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-luxury-muted" />
                </div>
                
                <select
                  value={notifFilter}
                  onChange={(e) => setNotifFilter(e.target.value)}
                  className="border border-[#EBE6DC] rounded-xl p-2 bg-[#FAF8F5]"
                >
                  <option value="all">All Alerts</option>
                  <option value="order">Order alerts</option>
                  <option value="inventory">Inventory alerts</option>
                  <option value="customer">Reviews / Inquiries</option>
                  <option value="tailor">Tailor updates</option>
                </select>

                <button
                  onClick={handleMarkAllRead}
                  className="border border-[#EBE6DC] hover:border-luxury-gold hover:text-luxury-gold rounded-xl px-4 py-2 font-semibold flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" /> Mark All Read
                </button>
              </div>
            </div>

            {/* List Notifications */}
            {getFilteredNotifications().length === 0 ? (
              <p className="text-luxury-muted font-light text-center py-10">No alerts matching filters found.</p>
            ) : (
              <div className="space-y-3">
                {getFilteredNotifications().map((n) => (
                  <div key={n.id} className={`border rounded-2xl p-4 flex justify-between gap-4 text-xs font-sans transition-colors ${
                    n.read 
                      ? 'bg-white border-[#EBE6DC]/60' 
                      : 'bg-luxury-cream border-luxury-gold/30 shadow-sm'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${n.read ? 'bg-zinc-300' : 'bg-luxury-gold'}`} />
                        <span className="font-serif text-sm font-bold text-luxury-dark">{n.title}</span>
                        <span className="bg-[#FAF8F5] border border-zinc-200 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold">
                          {n.type}
                        </span>
                      </div>
                      <p className="text-zinc-600 pl-4 font-light leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-luxury-muted pl-4 font-light mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-luxury-gold hover:underline font-bold text-[10px] uppercase tracking-wider"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 border border-zinc-200 rounded-lg hover:border-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
export default BoutiqueDashboard;

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User as UserIcon, ShoppingBag, Heart, MapPin, Truck, FileText, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { checkoutAPI, aiAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

export const UserDashboard: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  // State data
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [personalizedRecs, setPersonalizedRecs] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Address add form
  const [showForm, setShowForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?redirect=dashboard');
      return;
    }

    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'addresses') fetchAddresses();
    if (activeTab === 'profile') fetchPersonalizedRecommendations();
  }, [user, authLoading, activeTab]);

  const toArr = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : (Array.isArray(val?.orders) ? val.orders : (Array.isArray(val?.addresses) ? val.addresses : [])));

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await checkoutAPI.getOrders();
      setOrders(toArr(data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await checkoutAPI.getAddresses();
      setAddresses(toArr(data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchPersonalizedRecommendations = async () => {
    try {
      const viewedStr = localStorage.getItem('viewed_products') || '[]';
      const viewedIds = JSON.parse(viewedStr);
      const recs = await aiAPI.getPersonalized(viewedIds);
      setPersonalizedRecs(toArr(recs));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addr = await checkoutAPI.addAddress(newAddr);
      setAddresses([...addresses, addr]);
      setShowForm(false);
      setNewAddr({ name: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });
    } catch (err) {
      alert('Failed to add address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (window.confirm('Delete this address?')) {
      try {
        await checkoutAPI.deleteAddress(id);
        setAddresses(addresses.filter(a => a.id !== id));
      } catch (err) {
        alert('Failed to delete address');
      }
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleDownloadInvoice = (orderId: string) => {
    const url = checkoutAPI.getInvoiceUrl(orderId);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-luxury-dark uppercase tracking-wide">My Account</h1>
        <p className="text-xs text-luxury-muted mt-1 font-light">Manage your profile, active orders, wishlist, and shipping profiles</p>
      </div>

      {/* Dashboard Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Navigation Tabs */}
        <aside className="w-full lg:w-[220px] shrink-0 border border-neutral-100 bg-white rounded-xl p-4 space-y-2 shadow-sm">
          {[
            { id: 'profile', label: 'My Profile', icon: UserIcon },
            { id: 'orders', label: 'Order History', icon: ShoppingBag },
            { id: 'wishlist', label: 'My Wishlist', icon: Heart },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin }
          ].map((tab) => {
            const Icon = tab.icon;
            const isAct = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full text-left p-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider flex items-center gap-3 transition-colors ${
                  isAct
                    ? 'bg-luxury-dark text-white'
                    : 'hover:bg-neutral-50 text-luxury-dark'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
          
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full text-left p-2.5 rounded-lg font-semibold text-[10px] uppercase tracking-wider text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors pt-4 border-t border-neutral-100"
          >
            Logout Account
          </button>
        </aside>

        {/* Right Side: Tab Panel Content */}
        <main className="flex-1 w-full min-h-[60vh] bg-white border border-neutral-100 rounded-xl p-6 lg:p-8 shadow-sm">
          
          {/* PROFILE VIEW */}
          {activeTab === 'profile' && user && (
            <div className="space-y-10">
              <div className="space-y-4 border-b border-neutral-100 pb-6">
                <h2 className="font-serif text-xl font-bold text-luxury-dark">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mt-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-luxury-muted font-bold uppercase tracking-wider">Full Name</span>
                    <p className="text-xs font-semibold text-luxury-dark py-1">{user.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-luxury-muted font-bold uppercase tracking-wider">Email Address</span>
                    <p className="text-xs font-semibold text-luxury-dark py-1">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-luxury-muted font-bold uppercase tracking-wider">Account Access</span>
                    <p className="text-xs font-semibold text-luxury-gold uppercase py-1">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="space-y-6 pt-2">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-luxury-dark flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-luxury-gold fill-luxury-gold" /> Style Studio Recommendations
                  </h3>
                  <p className="text-xs text-luxury-muted font-light">Custom fashion recommendations curated just for you based on your browsing pattern.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {personalizedRecs.slice(0, 3).map(prod => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ORDER HISTORY VIEW */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-luxury-dark border-b border-neutral-100 pb-4">My Orders</h2>
              {loadingOrders ? (
                <p className="text-xs text-luxury-muted">Loading orders history...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
                  <p className="text-sm font-semibold text-luxury-dark">No orders placed yet</p>
                  <p className="text-xs text-luxury-muted mt-1 mb-6 font-light font-sans">Explore our signature catalogs to find boutique styles.</p>
                  <button onClick={() => navigate('/catalog')} className="bg-luxury-dark hover:bg-neutral-800 text-white px-6 py-2.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-colors">Explore Catalog</button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm bg-[#FAF9F6] text-xs">
                      
                      {/* Order info header */}
                      <div className="bg-white p-4 border-b border-neutral-100 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-[9px] uppercase font-bold text-luxury-muted">Order Placed</p>
                            <p className="font-semibold text-neutral-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-luxury-muted">Total Amount</p>
                            <p className="font-bold text-luxury-dark">Rs. {order.summary.total}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold text-luxury-muted">Shipment Status</p>
                            <span className={`inline-block px-2 py-0.5 mt-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                              order.orderStatus === 'Delivered'
                                ? 'bg-green-50 text-green-800'
                                : order.orderStatus === 'Cancelled'
                                ? 'bg-red-50 text-red-800'
                                : 'bg-blue-50 text-blue-800'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDownloadInvoice(order.id)}
                            className="border border-neutral-200 hover:border-luxury-dark text-[#333] px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors bg-white text-[10px] uppercase tracking-wide"
                          >
                            <FileText className="w-3.5 h-3.5 text-luxury-gold" /> Invoice
                          </button>
                        </div>
                      </div>

                      {/* Items loop */}
                      <div className="p-4 divide-y divide-neutral-100">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                            <div className="w-12 h-16 bg-luxury-cream rounded overflow-hidden shrink-0 border border-neutral-100">
                              <img src={item.image} alt="" className="w-full h-full object-cover object-top" />
                            </div>
                            <div className="flex-1 flex justify-between items-center text-xs">
                              <div>
                                <h4 className="font-semibold text-luxury-dark">{item.title}</h4>
                                <p className="text-[10px] text-luxury-muted mt-0.5">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                                <p className="text-[9px] font-semibold text-luxury-gold uppercase tracking-wider mt-0.5">{item.brand}</p>
                              </div>
                              <p className="font-bold text-luxury-dark">Rs. {item.price * item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Timeline shipment tracker */}
                      {order.orderStatus !== 'Cancelled' && (
                        <div className="bg-white border-t border-neutral-100 p-4 font-sans text-xs">
                          <p className="font-bold text-luxury-dark uppercase tracking-wider text-[9px] mb-3 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-luxury-gold" /> Delivery Milestone Tracker
                          </p>
                          <div className="flex items-center justify-between max-w-md mx-auto relative pt-2">
                            {/* Tracker background lines */}
                            <div className="absolute top-4 left-0 w-full h-0.5 bg-neutral-100 z-0" />
                            
                            {/* Steps indicators */}
                            {[
                              { label: 'Placed', isDone: true },
                              { label: 'Shipped', isDone: ['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus) },
                              { label: 'Out for Delivery', isDone: ['Out for Delivery', 'Delivered'].includes(order.orderStatus) },
                              { label: 'Delivered', isDone: order.orderStatus === 'Delivered' }
                            ].map((step, sIdx) => (
                              <div key={sIdx} className="flex flex-col items-center z-10 space-y-1">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                                  step.isDone
                                    ? 'bg-luxury-dark border-luxury-dark text-white'
                                    : 'bg-white border-zinc-200 text-zinc-300'
                                }`}>
                                  {step.isDone && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span className={`text-[8px] uppercase tracking-wider font-semibold ${
                                  step.isDone ? 'text-luxury-dark font-bold' : 'text-zinc-400'
                                }`}>{step.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY WISHLIST VIEW */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-luxury-dark border-b border-neutral-100 pb-4">My Wishlist</h2>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
                  <p className="text-sm font-semibold text-luxury-dark">Your wishlist is empty</p>
                  <p className="text-xs text-luxury-muted mt-1 mb-6 font-light">Save luxury garments and timepieces to purchase later.</p>
                  <button onClick={() => navigate('/catalog')} className="bg-luxury-dark hover:bg-neutral-800 text-white px-6 py-2.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-colors">Browse Styles</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {wishlistItems.map((prod) => (
                    <div key={prod.id} className="relative flex flex-col">
                      <ProductCard product={prod} />
                      <button
                        onClick={async () => {
                          const size = prod.stock > 0 ? 'M' : 'One Size';
                          await addToCart(prod.id, size, 'Default', 1, prod);
                          await toggleWishlist(prod);
                          alert('Moved to your bag!');
                        }}
                        className="w-full mt-3 bg-luxury-dark hover:bg-neutral-850 text-white text-[10px] font-semibold py-2.5 rounded-lg uppercase tracking-wider transition-colors"
                      >
                        Move to Bag
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SAVED ADDRESSES VIEW */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                <h2 className="font-serif text-xl font-bold text-luxury-dark">Shipping Profiles</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> {showForm ? 'Close Form' : 'Add Profile'}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans p-5 bg-[#FAF9F6] border border-neutral-100 rounded-xl">
                  <div className="space-y-1">
                    <label className="font-bold text-luxury-muted">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-luxury-muted">10-Digit Mobile Number</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-luxury-muted">Street / Locality address</label>
                    <input
                      type="text"
                      required
                      value={newAddr.street}
                      onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-luxury-muted">City</label>
                    <input
                      type="text"
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-luxury-muted">State</label>
                    <input
                      type="text"
                      required
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-luxury-muted">Pincode (6 Digits)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={newAddr.pincode}
                      onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dashboard_default_addr"
                      checked={newAddr.isDefault}
                      onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                      className="accent-luxury-gold"
                    />
                    <label htmlFor="dashboard_default_addr" className="font-semibold text-luxury-dark cursor-pointer text-xs">Set as default shipping profile</label>
                  </div>
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    <button type="submit" className="bg-luxury-gold hover:bg-[#a3803b] text-white font-semibold px-5 py-2 rounded-lg uppercase tracking-wider text-[10px] transition-colors">Save Address</button>
                    <button type="button" onClick={() => setShowForm(false)} className="border border-neutral-200 text-luxury-dark font-semibold px-5 py-2 rounded-lg bg-white uppercase text-[10px] transition-colors">Cancel</button>
                  </div>
                </form>
              )}

              {loadingAddresses ? (
                <p className="text-xs text-luxury-muted">Loading shipping profiles...</p>
              ) : addresses.length === 0 ? (
                <p className="text-xs text-luxury-muted font-light">No saved shipping profiles found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="p-4 border border-neutral-100 rounded-xl relative bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-xs text-luxury-dark">{addr.name}</p>
                        {addr.isDefault && (
                          <span className="bg-luxury-gold/10 text-luxury-gold text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-luxury-muted mt-2 leading-relaxed font-light font-sans">
                        {addr.street},<br />
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-luxury-dark mt-2 font-medium">Ph: {addr.phone}</p>
                      
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="absolute bottom-4 right-4 text-neutral-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
export default UserDashboard;

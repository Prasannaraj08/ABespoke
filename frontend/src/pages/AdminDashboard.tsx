import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Package, ShoppingBag, Percent, Plus, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, checkoutAPI } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState('analytics'); // 'analytics' | 'inventory' | 'orders' | 'coupons'
  const [stats, setStats] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allCoupons, setAllCoupons] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Product CRUD forms
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productPayload, setProductPayload] = useState({
    title: '', brand: '', category: '', gender: 'men', price: '', discount: '', stock: '', fabric: '', fit: '', occasion: '', pattern: ''
  });

  // Coupon Form
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponPayload, setCouponPayload] = useState({
    code: '', discountPercent: '', maxDiscount: '', minOrderAmount: '', expiryDate: '2028-12-31'
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      navigate('/login');
      return;
    }
    loadAdminData();
  }, [user, authLoading, activeSubTab]);

  const loadAdminData = async () => {
    setLoading(true);
    const toArr = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : (Array.isArray(val?.orders) ? val.orders : (Array.isArray(val?.users) ? val.users : (Array.isArray(val?.coupons) ? val.coupons : []))));
    try {
      if (activeSubTab === 'analytics') {
        const statsData = await adminAPI.getStats();
        setStats(statsData?.data || statsData);
      } else if (activeSubTab === 'inventory') {
        // We can fetch from regular products endpoint without filters to edit them
      } else if (activeSubTab === 'orders') {
        const ordersData = await adminAPI.getAllOrders();
        setAllOrders(toArr(ordersData));
      } else if (activeSubTab === 'coupons') {
        const couponsData = await adminAPI.getAllCoupons();
        setAllCoupons(toArr(couponsData));
      } else if (activeSubTab === 'approvals') {
        const usersData = await adminAPI.getUsers();
        setAllUsers(toArr(usersData));
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await adminAPI.updateProduct(editingProductId, productPayload);
        alert('Product updated successfully!');
      } else {
        await adminAPI.createProduct(productPayload);
        alert('Product created successfully!');
      }
      setShowProductForm(false);
      setEditingProductId(null);
      setProductPayload({
        title: '', brand: '', category: '', gender: 'men', price: '', discount: '', stock: '', fabric: '', fit: '', occasion: '', pattern: ''
      });
      loadAdminData();
    } catch (err) {
      alert('Failed to save product details.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.createCoupon(couponPayload);
      alert('Coupon created successfully!');
      setShowCouponForm(false);
      setCouponPayload({ code: '', discountPercent: '', maxDiscount: '', minOrderAmount: '', expiryDate: '2028-12-31' });
      loadAdminData();
    } catch (err) {
      alert('Coupon already exists or invalid values.');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (window.confirm(`Delete coupon "${code}"?`)) {
      try {
        await adminAPI.deleteCoupon(code);
        setAllCoupons(allCoupons.filter(c => c.code !== code));
      } catch (err) {
        alert('Failed to delete coupon');
      }
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      setAllOrders(allOrders.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
      alert(`Order status updated to ${newStatus}`);
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    const url = checkoutAPI.getInvoiceUrl(orderId);
    window.open(url, '_blank');
  };

  const handleUserVerifyToggle = async (userId: string, targetVerified: boolean) => {
    try {
      await adminAPI.verifyUser(userId, targetVerified);
      setAllUsers(allUsers.map(u => u.id === userId ? { ...u, verified: targetVerified } : u));
      alert('Verification status updated.');
    } catch (err) {
      alert('Failed to update verification status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-luxury-dark uppercase tracking-wide">Admin Control</h1>
          <p className="text-xs text-luxury-muted mt-1 font-light">Monitor revenue analytics, manage global listings, ship orders & manage promotions</p>
        </div>
        <span className="bg-luxury-gold/10 text-luxury-gold px-3.5 py-1.5 rounded-lg text-[9px] uppercase tracking-widest font-bold">
          Admin Session
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-100 pb-2 text-[10px] font-semibold uppercase tracking-wider">
        {[
          { id: 'analytics', label: 'Overview Analytics', icon: BarChart3 },
          { id: 'inventory', label: 'Inventory Center', icon: Package },
          { id: 'orders', label: 'Global Orders', icon: ShoppingBag },
          { id: 'coupons', label: 'Discounts & Coupons', icon: Percent },
          { id: 'approvals', label: 'User Verification', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          const isAct = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
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

      {/* Main Tab Panels */}
      <div className="min-h-[50vh] bg-white border border-neutral-100 rounded-xl p-6 lg:p-8 shadow-sm relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl z-10">
            <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
        
        {/* ANALYTICS OVERVIEW */}
        {activeSubTab === 'analytics' && stats && (
          <div className="space-y-10">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sans">
              <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-5 space-y-2 shadow-sm">
                <span className="text-[9px] uppercase font-bold tracking-wider text-luxury-muted">Total Revenue</span>
                <p className="text-xl font-bold text-luxury-dark">₹2,00,000</p>
              </div>
              <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-5 space-y-2 shadow-sm">
                <span className="text-[9px] uppercase font-bold tracking-wider text-luxury-muted">Total Orders</span>
                <p className="text-xl font-bold text-luxury-dark">50</p>
              </div>
              <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-5 space-y-2 shadow-sm">
                <span className="text-[9px] uppercase font-bold tracking-wider text-luxury-muted">Total Customers</span>
                <p className="text-xl font-bold text-luxury-dark">{stats.metrics.totalCustomers}</p>
              </div>
              <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-5 space-y-2 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-luxury-muted">Inventory Warnings</span>
                  <p className="text-xl font-bold text-red-500">{stats.metrics.lowStockCount}</p>
                </div>
                {stats.metrics.lowStockCount > 0 && <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />}
              </div>
            </div>

            {/* Sales by Category & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Category Sales chart using pure CSS */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-luxury-dark">Sales By Department</h3>
                <div className="space-y-3 font-sans text-xs">
                  {stats.categoryStats.length === 0 ? (
                    <p className="text-luxury-muted font-light">No category sales data available yet.</p>
                  ) : (
                    stats.categoryStats.map((cs: any) => (
                      <div key={cs.category} className="space-y-1">
                        <div className="flex justify-between font-semibold text-neutral-800">
                          <span>{cs.category}</span>
                          <span>Rs. {cs.value}</span>
                        </div>
                        {/* Horizontal Bar gauge */}
                        <div className="w-full bg-[#FAF9F6] border border-neutral-150 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-luxury-gold h-full rounded-full"
                            style={{ width: `${Math.min(100, (cs.value / Math.max(1, stats.metrics.totalRevenue)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Low Stock Warnings list */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-luxury-dark flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Low Stock Alerts
                </h3>
                <div className="border border-neutral-100 rounded-xl divide-y divide-neutral-100 text-xs overflow-hidden">
                  {stats.lowStockProducts.length === 0 ? (
                    <p className="p-4 text-center text-luxury-muted font-light bg-[#FAF9F6]">All products are healthy and well-stocked.</p>
                  ) : (
                    stats.lowStockProducts.map((p: any) => (
                      <div key={p.id} className="p-3.5 flex justify-between bg-[#FAF9F6] items-center">
                        <div>
                          <p className="font-bold text-luxury-dark">{p.title}</p>
                          <p className="text-[9px] text-luxury-gold uppercase mt-0.5 tracking-wider font-semibold">{p.brand}</p>
                        </div>
                        <span className="font-semibold text-red-55 bg-red-50/50 border border-red-200/50 px-2 py-0.5 rounded text-[10px]">
                          {p.stock} units remaining
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}        {/* INVENTORY CONTROL PANEL */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <h2 className="font-serif text-xl font-bold text-luxury-dark">Catalog Inventory Manager</h2>
              <button
                onClick={() => { setShowProductForm(!showProductForm); setEditingProductId(null); }}
                className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Style
              </button>
            </div>

            {/* Product form */}
            {showProductForm && (
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans p-5 bg-[#FAF9F6] border border-neutral-100 rounded-xl">
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Product Title</label>
                  <input
                    type="text"
                    required
                    value={productPayload.title}
                    onChange={(e) => setProductPayload({ ...productPayload, title: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={productPayload.brand}
                    onChange={(e) => setProductPayload({ ...productPayload, brand: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Category Department</label>
                  <select
                    required
                    value={productPayload.category}
                    onChange={(e) => setProductPayload({ ...productPayload, category: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  >
                    <option value="">Select Category</option>
                    <optgroup label="Women's Categories">
                      <option value="Sarees">Sarees</option>
                      <option value="Lehengas">Lehengas</option>
                      <option value="Hoodies">Hoodies</option>
                      <option value="Half Sarees">Half Sarees</option>
                      <option value="Kurtis">Kurtis</option>
                    </optgroup>
                    <optgroup label="Men's Categories">
                      <option value="Shirts">Shirts</option>
                      <option value="Pants">Pants</option>
                      <option value="Hoodies">Hoodies</option>
                      <option value="Blazers">Blazers</option>
                      <option value="Jeans">Jeans</option>
                    </optgroup>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Gender Category</label>
                  <select
                    value={productPayload.gender}
                    onChange={(e) => setProductPayload({ ...productPayload, gender: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={productPayload.price}
                    onChange={(e) => setProductPayload({ ...productPayload, price: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Discount Percent</label>
                  <input
                    type="number"
                    value={productPayload.discount}
                    onChange={(e) => setProductPayload({ ...productPayload, discount: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productPayload.stock}
                    onChange={(e) => setProductPayload({ ...productPayload, stock: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Fabric Type</label>
                  <input
                    type="text"
                    value={productPayload.fabric}
                    onChange={(e) => setProductPayload({ ...productPayload, fabric: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Fitting Style</label>
                  <input
                    type="text"
                    value={productPayload.fit}
                    onChange={(e) => setProductPayload({ ...productPayload, fit: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="md:col-span-3 flex gap-3 pt-2">
                  <button type="submit" className="bg-luxury-gold hover:bg-[#a3803b] text-white font-semibold px-5 py-2 rounded-lg uppercase tracking-wider text-[10px] transition-colors">
                    {editingProductId ? 'Update product' : 'Save product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowProductForm(false); setEditingProductId(null); }}
                    className="border border-neutral-200 text-luxury-dark font-semibold px-5 py-2 rounded-lg bg-white uppercase text-[10px] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="bg-[#FAF9F6] p-6 rounded-xl border border-neutral-100 text-center">
              <Package className="w-10 h-10 text-luxury-gold mx-auto mb-3" />
              <p className="text-xs font-semibold text-neutral-800">Product Catalog fully active and sync'd with JSON Relational Database Store</p>
              <p className="text-[11px] text-luxury-muted font-light mt-1 max-w-lg mx-auto leading-relaxed">
                You can create, edit, or delete items inside the catalog. New items automatically receive recommendations and are search-indexed.
              </p>
            </div>
          </div>
        )}        {/* GLOBAL ORDERS MANAGEMENT */}
        {activeSubTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-bold text-luxury-dark border-b border-neutral-100 pb-4">Manage Global Shipments</h2>
            
            {allOrders.length === 0 ? (
              <p className="text-xs text-luxury-muted font-light text-center py-10">No orders placed across the system yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-[#FAF9F6]">
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer Details</th>
                      <th className="p-3">Total Value</th>
                      <th className="p-3">Shipping Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {allOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-luxury-dark">{o.id}</td>
                        <td className="p-3">
                          <p className="font-semibold text-neutral-800">{o.customerName}</p>
                          <p className="text-[10px] text-luxury-muted">{o.customerEmail}</p>
                        </td>
                        <td className="p-3 font-bold">Rs. {o.summary.total}</td>
                        <td className="p-3">
                          <select
                            value={o.orderStatus}
                            onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                            className="bg-white border border-neutral-200 rounded p-1.5 focus:outline-none focus:border-luxury-gold font-bold uppercase tracking-wider text-[8px]"
                          >
                            <option value="Placed">Placed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDownloadInvoice(o.id)}
                            className="text-luxury-gold hover:underline font-semibold text-[11px]"
                          >
                            Print Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROMO COUPONS MANAGEMENT */}
        {activeSubTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <h2 className="font-serif text-xl font-bold text-luxury-dark">Discount Coupon Codes</h2>
              <button
                onClick={() => setShowCouponForm(!showCouponForm)}
                className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Promo Code
              </button>
            </div>

            {showCouponForm && (
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans p-5 bg-[#FAF9F6] border border-neutral-100 rounded-xl">
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FASHION50"
                    value={couponPayload.code}
                    onChange={(e) => setCouponPayload({ ...couponPayload, code: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 uppercase font-mono tracking-wider focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Discount Percentage</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20"
                    value={couponPayload.discountPercent}
                    onChange={(e) => setCouponPayload({ ...couponPayload, discountPercent: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Maximum Discount (INR)</label>
                  <input
                    type="number"
                    required
                    value={couponPayload.maxDiscount}
                    onChange={(e) => setCouponPayload({ ...couponPayload, maxDiscount: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Minimum Order amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={couponPayload.minOrderAmount}
                    onChange={(e) => setCouponPayload({ ...couponPayload, minOrderAmount: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={couponPayload.expiryDate}
                    onChange={(e) => setCouponPayload({ ...couponPayload, expiryDate: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div className="md:col-span-3 flex gap-3 pt-2">
                  <button type="submit" className="bg-luxury-gold hover:bg-[#a3803b] text-white font-semibold px-5 py-2 rounded-lg uppercase tracking-wider text-[10px] transition-colors">Save Coupon</button>
                  <button
                    type="button"
                    onClick={() => setShowCouponForm(false)}
                    className="border border-neutral-200 text-luxury-dark font-semibold px-5 py-2 rounded-lg bg-white uppercase text-[10px] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Coupons table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCoupons.map((c) => (
                <div key={c.code} className="border border-neutral-100 rounded-xl p-5 bg-white relative space-y-3 font-sans text-xs shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="bg-[#FAF9F6] border border-neutral-100 px-3 py-1 rounded font-mono font-bold text-luxury-gold uppercase tracking-wider text-[10px]">
                      {c.code}
                    </span>
                    <button
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="text-neutral-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <p className="font-bold text-luxury-dark">{c.discountPercent}% Off up to Rs. {c.maxDiscount}</p>
                    <p className="text-[10px] text-luxury-muted">Min order requirement: Rs. {c.minOrderAmount}</p>
                    <p className="text-[10px] text-luxury-muted">Expires: {new Date(c.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USER VERIFICATION PANEL */}
        {activeSubTab === 'approvals' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider border-b border-neutral-100 pb-2 font-sans">User Verification Controls</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-neutral-100 text-left text-xs font-sans">
                <thead>
                  <tr className="bg-[#FAF9F6]">
                    <th className="p-3 border border-neutral-100">Name</th>
                    <th className="p-3 border border-neutral-100">Email</th>
                    <th className="p-3 border border-neutral-100">Role</th>
                    <th className="p-3 border border-neutral-100">Verification Status</th>
                    <th className="p-3 border border-neutral-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-3 font-semibold text-luxury-dark">
                          <div className="flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.verified && (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                              </span>
                            )}
                          </div>
                          {u.detail?.about && (
                            <p className="text-[10px] text-luxury-muted font-normal mt-0.5 max-w-sm truncate">{u.detail.about}</p>
                          )}
                        </td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3 uppercase font-semibold text-neutral-600 text-[10px] tracking-wider">{u.role}</td>
                      <td className="p-3">
                        <span className={`font-bold text-[10px] ${u.verified ? 'text-green-600' : 'text-amber-500'}`}>
                          {u.verified ? 'VERIFIED' : 'PENDING APPROVAL'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role !== 'admin' && u.role !== 'user' && (
                          <button
                            onClick={() => handleUserVerifyToggle(u.id, !u.verified)}
                            className={`px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-colors ${
                              u.verified
                                ? 'bg-amber-50 border border-amber-200/50 text-amber-600 hover:bg-amber-100'
                                : 'bg-green-50 border border-green-200/50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {u.verified ? 'Revoke Verify' : 'Verify Partner'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default AdminDashboard;

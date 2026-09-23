import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Package, ShoppingBag, Percent, Plus, Trash2,
  ShieldAlert, CheckCircle, Pencil, X, Save, Search, RefreshCcw, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, checkoutAPI } from '../services/api';

const CATEGORIES = [
  'Sarees', 'Lehengas', 'Half Sarees', 'Kurtis',
  'Shirts', 'Pants', 'Hoodies', 'Blazers', 'Jeans'
];

const Field = ({ label, val, onChange, type = 'text' }: { label: string; val: string; onChange: (v: string) => void; type?: string }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-luxury-muted uppercase tracking-wide">{label}</label>
    <input type={type} value={val} onChange={e => onChange(e.target.value)}
      className="w-full border border-neutral-200 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold" />
  </div>
);

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('analytics');
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newProd, setNewProd] = useState({
    title: '', brand: '', category: '', gender: 'men', price: '', discount: '0',
    stock: '50', fabric: '', fit: '', occasion: '', pattern: '',
    description: 'Premium product from ABespoke.',
  });
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponData, setCouponData] = useState({
    code: '', discountPercent: '', maxDiscount: '', minOrderAmount: '', expiryDate: '2028-12-31'
  });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) { navigate('/login'); return; }
    load();
  }, [user, authLoading, tab]);

  const toArr = (v: any): any[] =>
    Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data
      : Array.isArray(v?.orders) ? v.orders : Array.isArray(v?.users) ? v.users
      : Array.isArray(v?.coupons) ? v.coupons : [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'analytics') {
        const s = await adminAPI.getStats();
        setStats(s?.data || s);
      } else if (tab === 'inventory') {
        const p = await adminAPI.getAllProducts();
        setProducts(toArr(p));
      } else if (tab === 'orders') {
        setOrders(toArr(await adminAPI.getAllOrders()));
      } else if (tab === 'coupons') {
        setCoupons(toArr(await adminAPI.getAllCoupons()));
      } else if (tab === 'approvals') {
        setUsers(toArr(await adminAPI.getUsers()));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [tab]);

  const startEdit = (p: any) => {
    setEditId(p.id);
    setEditData({
      title: p.title || '', brand: p.brand || '', category: p.category || '',
      gender: p.gender || 'women', price: String(p.price || ''), discount: String(p.discount || 0),
      stock: String(p.stock || 0), fabric: p.fabric || '', fit: p.fit || '',
      occasion: p.occasion || '', pattern: p.pattern || '', description: p.description || '',
    });
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    try {
      await adminAPI.updateProduct(id, {
        ...editData, price: Number(editData.price),
        discount: Number(editData.discount), stock: Number(editData.stock),
      });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...editData, price: Number(editData.price), discount: Number(editData.discount), stock: Number(editData.stock) } : p));
      setEditId(null);
      notify('Product updated! Live on website now.');
    } catch { notify('Failed to update product.', false); }
    finally { setSavingId(null); }
  };

  const deleteProd = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"?\n\nThis removes it from the ENTIRE website immediately.`)) return;
    setDeletingId(id);
    try {
      await adminAPI.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      notify(`"${title}" permanently deleted from website.`);
    } catch { notify('Failed to delete product.', false); }
    finally { setDeletingId(null); }
  };

  const togglePause = async (p: any) => {
    try {
      await adminAPI.updateProduct(p.id, { paused: !p.paused });
      setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, paused: !pr.paused } : pr));
      notify(p.paused ? `"${p.title}" is now visible.` : `"${p.title}" hidden from catalog.`);
    } catch { notify('Failed to toggle visibility.', false); }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminAPI.createProduct({
        ...newProd, price: Number(newProd.price), discount: Number(newProd.discount),
        stock: Number(newProd.stock), sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Black', 'White', 'Navy'],
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'],
        trending: false, stockStatus: 'in_stock',
      });
      setProducts(prev => [created?.product || created, ...prev]);
      setShowAdd(false);
      setNewProd({ title: '', brand: '', category: '', gender: 'men', price: '', discount: '0', stock: '50', fabric: '', fit: '', occasion: '', pattern: '', description: 'Premium product from ABespoke.' });
      notify('New product added and live on the website!');
    } catch (err: any) { notify(err?.response?.data?.message || 'Failed to add product.', false); }
  };

  const addCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.createCoupon(couponData);
      notify('Coupon created!');
      setShowCouponForm(false);
      setCouponData({ code: '', discountPercent: '', maxDiscount: '', minOrderAmount: '', expiryDate: '2028-12-31' });
      load();
    } catch { notify('Coupon already exists or invalid values.', false); }
  };

  const delCoupon = async (code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await adminAPI.deleteCoupon(code);
      setCoupons(prev => prev.filter(c => c.code !== code));
      notify(`Coupon ${code} deleted.`);
    } catch { notify('Failed to delete coupon.', false); }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: status } : o));
      notify(`Order updated to ${status}`);
    } catch { notify('Failed to update order.', false); }
  };

  const verifyUser = async (uid: string, v: boolean) => {
    try {
      await adminAPI.verifyUser(uid, v);
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, verified: v } : u));
      notify('Verification status updated.');
    } catch { notify('Failed to update verification.', false); }
  };

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [p.title, p.brand, p.category, p.id].some(v => v?.toLowerCase().includes(q));
  });

  const setE = (key: string) => (val: string) => setEditData((d: any) => ({ ...d, [key]: val }));

  const TABS = [
    { id: 'analytics', label: 'Overview Analytics', icon: BarChart3 },
    { id: 'inventory', label: tab === 'inventory' ? `Inventory (${products.length})` : 'Inventory', icon: Package },
    { id: 'orders', label: 'Global Orders', icon: ShoppingBag },
    { id: 'coupons', label: 'Discounts & Coupons', icon: Percent },
    { id: 'approvals', label: 'User Verification', icon: ShieldAlert },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 font-sans space-y-8">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-luxury-dark uppercase tracking-wide">Admin Control</h1>
          <p className="text-xs text-luxury-muted mt-1 font-light">Full control over inventory, orders, promotions and users</p>
        </div>
        <span className="bg-luxury-gold/10 text-luxury-gold px-3.5 py-1.5 rounded-lg text-[9px] uppercase tracking-widest font-bold">Admin Session</span>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-neutral-100 pb-2 text-[10px] font-semibold uppercase tracking-wider">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${tab === t.id ? 'border-luxury-dark text-luxury-dark font-bold' : 'border-transparent text-luxury-muted hover:text-luxury-dark'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[50vh] bg-white border border-neutral-100 rounded-xl p-6 lg:p-8 shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
            <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && stats && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', val: `₹${stats.metrics.totalRevenue?.toLocaleString('en-IN') || 0}`, red: false },
                { label: 'Total Orders', val: stats.metrics.totalOrders, red: false },
                { label: 'Total Customers', val: stats.metrics.totalCustomers, red: false },
                { label: 'Low Stock Alerts', val: stats.metrics.lowStockCount, red: true },
              ].map(m => (
                <div key={m.label} className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-5 space-y-1 shadow-sm">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-luxury-muted">{m.label}</span>
                  <p className={`text-xl font-bold ${m.red ? 'text-red-500' : 'text-luxury-dark'}`}>{m.val}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-luxury-dark">Sales By Department</h3>
                <div className="space-y-3 text-xs">
                  {stats.categoryStats.length === 0 ? <p className="text-luxury-muted">No sales data yet.</p>
                    : stats.categoryStats.map((cs: any) => (
                      <div key={cs.category} className="space-y-1">
                        <div className="flex justify-between font-semibold text-neutral-800"><span>{cs.category}</span><span>₹{cs.value}</span></div>
                        <div className="w-full bg-[#FAF9F6] h-2 rounded-full overflow-hidden">
                          <div className="bg-luxury-gold h-full rounded-full" style={{ width: `${Math.min(100, (cs.value / Math.max(1, stats.metrics.totalRevenue)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-luxury-dark flex items-center gap-1.5"><ShieldAlert className="w-5 h-5 text-red-500" /> Low Stock Alerts</h3>
                <div className="border border-neutral-100 rounded-xl divide-y text-xs overflow-hidden">
                  {stats.lowStockProducts.length === 0 ? <p className="p-4 text-center text-luxury-muted bg-[#FAF9F6]">All products well-stocked.</p>
                    : stats.lowStockProducts.map((p: any) => (
                      <div key={p.id} className="p-3.5 flex justify-between bg-[#FAF9F6] items-center">
                        <div><p className="font-bold text-luxury-dark">{p.title}</p><p className="text-[9px] text-luxury-gold uppercase tracking-wider font-semibold">{p.brand}</p></div>
                        <span className="font-semibold text-red-500 bg-red-50/50 border border-red-200/50 px-2 py-0.5 rounded text-[10px]">{p.stock} left</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {tab === 'inventory' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-luxury-dark">Catalog Inventory Manager</h2>
                <p className="text-[11px] text-luxury-muted mt-0.5">{filtered.length} of {products.length} products • All changes are live instantly on the entire website</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={load} className="flex items-center gap-1 border border-neutral-200 text-luxury-muted hover:text-luxury-dark rounded-lg px-3 py-2 text-[10px] font-semibold transition-colors">
                  <RefreshCcw className="w-3.5 h-3.5" /> Refresh
                </button>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>
            </div>

            {showAdd && (
              <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs p-5 bg-[#FAF9F6] border border-neutral-200 rounded-xl">
                <div className="md:col-span-3 font-bold text-luxury-dark text-sm">Add New Product to Website</div>
                {[
                  { l: 'Title *', k: 'title', r: true }, { l: 'Brand *', k: 'brand', r: true },
                  { l: 'Fabric', k: 'fabric' }, { l: 'Fit Style', k: 'fit' },
                  { l: 'Occasion', k: 'occasion' }, { l: 'Pattern', k: 'pattern' },
                ].map(f => (
                  <div key={f.k} className="space-y-1">
                    <label className="font-semibold text-luxury-muted text-[10px]">{f.l}</label>
                    <input type="text" required={f.r} value={(newProd as any)[f.k]}
                      onChange={e => setNewProd(n => ({ ...n, [f.k]: e.target.value }))}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold text-xs" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="font-semibold text-luxury-muted text-[10px]">Category *</label>
                  <select required value={newProd.category} onChange={e => setNewProd(n => ({ ...n, category: e.target.value }))}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold text-xs">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-luxury-muted text-[10px]">Gender *</label>
                  <select value={newProd.gender} onChange={e => setNewProd(n => ({ ...n, gender: e.target.value }))}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold text-xs">
                    <option value="women">Women</option><option value="men">Men</option>
                  </select>
                </div>
                {[
                  { l: 'Price ₹ *', k: 'price', r: true }, { l: 'Discount %', k: 'discount' }, { l: 'Stock Qty', k: 'stock' },
                ].map(f => (
                  <div key={f.k} className="space-y-1">
                    <label className="font-semibold text-luxury-muted text-[10px]">{f.l}</label>
                    <input type="number" required={f.r} value={(newProd as any)[f.k]}
                      onChange={e => setNewProd(n => ({ ...n, [f.k]: e.target.value }))}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold text-xs" />
                  </div>
                ))}
                <div className="md:col-span-3 space-y-1">
                  <label className="font-semibold text-luxury-muted text-[10px]">Description</label>
                  <textarea rows={2} value={newProd.description} onChange={e => setNewProd(n => ({ ...n, description: e.target.value }))}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold text-xs" />
                </div>
                <div className="md:col-span-3 flex gap-3">
                  <button type="submit" className="bg-luxury-gold hover:bg-[#a3803b] text-white font-semibold px-5 py-2 rounded-lg uppercase text-[10px]">Add to Website</button>
                  <button type="button" onClick={() => setShowAdd(false)} className="border border-neutral-200 text-luxury-dark font-semibold px-5 py-2 rounded-lg bg-white uppercase text-[10px]">Cancel</button>
                </div>
              </form>
            )}

            {editId && (
              <div className="p-5 bg-blue-50/40 border border-blue-200/60 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-luxury-dark text-sm">Editing: <span className="text-luxury-gold">{editData.title}</span></p>
                  <button onClick={() => setEditId(null)}><X className="w-4 h-4 text-neutral-400 hover:text-red-500" /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Title" val={editData.title} onChange={setE('title')} />
                  <Field label="Brand" val={editData.brand} onChange={setE('brand')} />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-luxury-muted uppercase">Category</label>
                    <select value={editData.category || ''} onChange={e => setEditData((d: any) => ({ ...d, category: e.target.value }))}
                      className="w-full border border-neutral-200 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-luxury-muted uppercase">Gender</label>
                    <select value={editData.gender || 'women'} onChange={e => setEditData((d: any) => ({ ...d, gender: e.target.value }))}
                      className="w-full border border-neutral-200 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold">
                      <option value="women">Women</option><option value="men">Men</option>
                    </select>
                  </div>
                  <Field label="Price ₹" val={editData.price} onChange={setE('price')} type="number" />
                  <Field label="Discount %" val={editData.discount} onChange={setE('discount')} type="number" />
                  <Field label="Stock Qty" val={editData.stock} onChange={setE('stock')} type="number" />
                  <Field label="Fabric" val={editData.fabric} onChange={setE('fabric')} />
                  <Field label="Fit Style" val={editData.fit} onChange={setE('fit')} />
                  <Field label="Occasion" val={editData.occasion} onChange={setE('occasion')} />
                  <Field label="Pattern" val={editData.pattern} onChange={setE('pattern')} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => saveEdit(editId)} disabled={savingId === editId}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-[10px] uppercase disabled:opacity-60">
                    {savingId === editId ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><Save className="w-3 h-3" /> Save Changes</>}
                  </button>
                  <button onClick={() => setEditId(null)} className="border border-neutral-200 text-neutral-600 font-semibold px-5 py-2 rounded-lg text-[10px] uppercase">Cancel</button>
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luxury-muted" />
              <input type="text" placeholder="Search by title, brand, category or ID…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-luxury-gold" />
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-luxury-muted text-xs">
                {products.length === 0 ? 'No products in the database.' : 'No products match your search.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-100">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-neutral-100 text-[9px] uppercase tracking-wider text-luxury-muted">
                      <th className="p-3">Image</th>
                      <th className="p-3 min-w-[160px]">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filtered.map((p: any) => (
                      <tr key={p.id} className={`hover:bg-neutral-50/40 transition-colors ${p.paused ? 'opacity-50' : ''} ${editId === p.id ? 'bg-blue-50/20' : ''}`}>
                        <td className="p-3">
                          <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=80'}
                            alt={p.title} className="w-10 h-12 object-cover rounded-lg border border-neutral-100" />
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-luxury-dark leading-tight max-w-[180px] truncate">{p.title}</p>
                          <p className="text-[9px] text-luxury-gold uppercase tracking-wider font-bold mt-0.5">{p.brand}</p>
                          <p className="text-[9px] text-neutral-300 font-mono mt-0.5 truncate max-w-[160px]">{p.id}</p>
                        </td>
                        <td className="p-3 text-neutral-700">{p.category}</td>
                        <td className="p-3 capitalize text-neutral-600">{p.gender}</td>
                        <td className="p-3 font-bold text-luxury-dark">₹{p.price?.toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          {p.discount > 0
                            ? <span className="bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded text-[9px] font-bold">{p.discount}% off</span>
                            : <span className="text-neutral-300">—</span>}
                        </td>
                        <td className="p-3"><span className={p.stock < 10 ? 'text-red-500 font-bold' : 'text-neutral-700'}>{p.stock}</span></td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${p.paused ? 'bg-neutral-100 text-neutral-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {p.paused ? 'Hidden' : 'Live'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => startEdit(p)}
                              className={`flex items-center gap-1 border px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${editId === p.id ? 'border-luxury-gold text-luxury-gold bg-luxury-gold/10' : 'border-neutral-200 hover:border-luxury-gold text-luxury-muted hover:text-luxury-dark'}`}>
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button onClick={() => togglePause(p)} title={p.paused ? 'Show in catalog' : 'Hide from catalog'}
                              className="border border-neutral-200 hover:border-amber-300 text-neutral-400 hover:text-amber-600 p-1.5 rounded-lg transition-colors">
                              {p.paused ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => deleteProd(p.id, p.title)} disabled={deletingId === p.id}
                              className="border border-neutral-200 hover:border-red-300 text-neutral-300 hover:text-red-600 p-1.5 rounded-lg transition-colors disabled:opacity-60">
                              {deletingId === p.id
                                ? <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-bold text-luxury-dark border-b border-neutral-100 pb-4">Manage Global Shipments</h2>
            {orders.length === 0 ? <p className="text-xs text-luxury-muted text-center py-10">No orders placed yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-[#FAF9F6]">
                      <th className="p-3">Order ID</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-neutral-50/50">
                        <td className="p-3 font-mono font-bold text-luxury-dark text-[10px]">{o.id}</td>
                        <td className="p-3"><p className="font-semibold">{o.customerName}</p><p className="text-[10px] text-luxury-muted">{o.customerEmail}</p></td>
                        <td className="p-3 font-bold">₹{o.summary?.total}</td>
                        <td className="p-3">
                          <select value={o.orderStatus} onChange={e => updateOrderStatus(o.id, e.target.value)}
                            className="bg-white border border-neutral-200 rounded p-1.5 focus:outline-none focus:border-luxury-gold font-bold uppercase text-[8px] tracking-wider">
                            {['Placed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => window.open(checkoutAPI.getInvoiceUrl(o.id), '_blank')} className="text-luxury-gold hover:underline font-semibold text-[11px]">Print Invoice</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* COUPONS */}
        {tab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <h2 className="font-serif text-xl font-bold text-luxury-dark">Discount Coupon Codes</h2>
              <button onClick={() => setShowCouponForm(!showCouponForm)} className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Promo Code
              </button>
            </div>
            {showCouponForm && (
              <form onSubmit={addCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs p-5 bg-[#FAF9F6] border border-neutral-100 rounded-xl">
                {[
                  { l: 'Coupon Code', k: 'code', ph: 'e.g. FASHION50' },
                  { l: 'Discount %', k: 'discountPercent', t: 'number' },
                  { l: 'Max Discount ₹', k: 'maxDiscount', t: 'number' },
                  { l: 'Min Order ₹', k: 'minOrderAmount', t: 'number' },
                ].map(f => (
                  <div key={f.k} className="space-y-1">
                    <label className="font-bold text-luxury-muted">{f.l}</label>
                    <input type={f.t || 'text'} required placeholder={f.ph || ''} value={(couponData as any)[f.k]}
                      onChange={e => setCouponData(c => ({ ...c, [f.k]: e.target.value }))}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="font-bold text-luxury-muted">Expiry Date</label>
                  <input type="date" required value={couponData.expiryDate} onChange={e => setCouponData(c => ({ ...c, expiryDate: e.target.value }))}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold" />
                </div>
                <div className="md:col-span-3 flex gap-3">
                  <button type="submit" className="bg-luxury-gold hover:bg-[#a3803b] text-white font-semibold px-5 py-2 rounded-lg uppercase text-[10px]">Save Coupon</button>
                  <button type="button" onClick={() => setShowCouponForm(false)} className="border border-neutral-200 text-luxury-dark font-semibold px-5 py-2 rounded-lg bg-white uppercase text-[10px]">Cancel</button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map(c => (
                <div key={c.code} className="border border-neutral-100 rounded-xl p-5 bg-white space-y-3 text-xs shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="bg-[#FAF9F6] border border-neutral-100 px-3 py-1 rounded font-mono font-bold text-luxury-gold uppercase text-[10px] tracking-wider">{c.code}</span>
                    <button onClick={() => delCoupon(c.code)} className="text-neutral-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <p className="font-bold text-luxury-dark">{c.discountPercent}% Off up to ₹{c.maxDiscount}</p>
                    <p className="text-[10px] text-luxury-muted">Min order: ₹{c.minOrderAmount}</p>
                    <p className="text-[10px] text-luxury-muted">Expires: {new Date(c.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USER VERIFICATION */}
        {tab === 'approvals' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider border-b border-neutral-100 pb-2">User Verification Controls</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-neutral-100 text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF9F6]">
                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => <th key={h} className="p-3 border border-neutral-100">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-neutral-50/50">
                      <td className="p-3 font-semibold text-luxury-dark">
                        <div className="flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.verified && <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full text-[9px] font-bold"><CheckCircle className="w-3 h-3" /> Verified</span>}
                        </div>
                        {u.detail?.about && <p className="text-[10px] text-luxury-muted mt-0.5 max-w-sm truncate">{u.detail.about}</p>}
                      </td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3 uppercase font-semibold text-neutral-600 text-[10px] tracking-wider">{u.role}</td>
                      <td className="p-3"><span className={`font-bold text-[10px] ${u.verified ? 'text-green-600' : 'text-amber-500'}`}>{u.verified ? 'VERIFIED' : 'PENDING'}</span></td>
                      <td className="p-3">
                        {u.role !== 'admin' && u.role !== 'user' && (
                          <button onClick={() => verifyUser(u.id, !u.verified)}
                            className={`px-3 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-colors ${u.verified ? 'bg-amber-50 border border-amber-200/50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 border border-green-200/50 text-green-600 hover:bg-green-100'}`}>
                            {u.verified ? 'Revoke' : 'Verify Partner'}
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

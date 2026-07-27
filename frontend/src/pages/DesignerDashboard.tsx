import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, BarChart3, Mail, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { designerAPI } from '../services/api';
import ImageUpload from '../components/ImageUpload';

export const DesignerDashboard: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'portfolio' | 'requests'
  const [profile, setProfile] = useState<any>({
    designerName: '',
    portfolioImages: [] as string[],
    exclusiveCollections: [] as string[],
    about: '',
    verified: false,
    customizationTerms: ''
  });
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Portfolio builder inputs
  const [collectionName, setCollectionName] = useState('');

  // Request reply state
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'designer') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, authLoading]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Profile
      const profData = await designerAPI.getProfile();
      const p = profData?.data || profData || {};
      setProfile({
        ...p,
        portfolioImages: Array.isArray(p.portfolioImages) ? p.portfolioImages : [],
        exclusiveCollections: Array.isArray(p.exclusiveCollections) ? p.exclusiveCollections : []
      });

      // Load Requests
      const reqs = await designerAPI.getCustomizations();
      setCustomRequests(Array.isArray(reqs) ? reqs : (reqs?.data || []));
    } catch (err) {
      console.error('Failed to load designer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await designerAPI.updateProfile(profile);
      const data = updated?.data || updated;
      setProfile({
        ...data,
        portfolioImages: Array.isArray(data.portfolioImages) ? data.portfolioImages : [],
        exclusiveCollections: Array.isArray(data.exclusiveCollections) ? data.exclusiveCollections : []
      });
      showToast('success', '✅ Portfolio Updated Successfully! All changes are now live to customers.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update portfolio. Please check image URLs and try again.';
      showToast('error', `❌ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCollection = () => {
    if (collectionName.trim()) {
      const updatedCols = [...profile.exclusiveCollections, collectionName.trim()];
      setProfile({ ...profile, exclusiveCollections: updatedCols });
      setCollectionName('');
    }
  };

  const handleCustomRequestStatus = async (id: string, nextStatus: 'accepted' | 'rejected' | 'completed') => {
    try {
      await designerAPI.updateCustomizationStatus(id, nextStatus, replyText);
      setCustomRequests(customRequests.map(r => r.id === id ? { ...r, status: nextStatus, reply: replyText || r.reply } : r));
      setReplyText('');
      setActiveReqId(null);
      showToast('success', `Custom request transitioned to ${nextStatus}.`);
    } catch (err) {
      showToast('error', 'Failed to update request status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans space-y-8">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`p-4 rounded-xl text-xs font-sans flex items-center gap-3 border shadow-sm ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-semibold leading-relaxed">{toast.message}</span>
        </div>
      )}

      {/* Verification Warning Banner */}
      {!profile.verified && (
        <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-5 flex items-start gap-4 text-amber-800 shadow-sm leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 font-sans">
            <h4 className="font-bold uppercase tracking-wider text-[9px]">Verification Pending</h4>
            <p className="font-light">
              Your Designer profile is currently under review by our fashion administration team. 
              Add portfolio images and collections to automatically trigger verified status.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-luxury-dark uppercase tracking-wide flex items-center gap-2 flex-wrap">
            <span>{profile.designerName || 'Designer Label'}</span>
            {profile.verified ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-sans tracking-normal font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Verified Portfolio
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-0.5 rounded-full font-sans tracking-normal font-semibold">
                Verification Pending
              </span>
            )}
          </h1>
          <p className="text-xs text-luxury-muted mt-1 font-light">
            Showcase your collections, publish lookbooks & coordinate client customizations
          </p>
        </div>
        <button
          onClick={logout}
          className="text-red-500 border border-red-200 px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-100 pb-2 text-[10px] font-semibold uppercase tracking-wider">
        {[
          { id: 'overview', label: 'Designer Overview', icon: BarChart3 },
          { id: 'portfolio', label: 'Portfolio & Collection Builder', icon: Palette },
          { id: 'requests', label: 'Custom Requests Inbox', icon: Mail }
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

      {/* Main Tab Panels */}
      <div className="min-h-[50vh] bg-white border border-neutral-100 rounded-xl p-6 lg:p-8 shadow-sm">
        
        {/* OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-5 space-y-2 shadow-sm">
                <span className="text-[9px] uppercase font-bold tracking-wider text-luxury-muted">Exclusive Collections</span>
                <p className="text-xl font-bold text-luxury-dark">{profile.exclusiveCollections.length}</p>
              </div>
              <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-5 space-y-2 shadow-sm">
                <span className="text-[9px] uppercase font-bold tracking-wider text-luxury-muted">Custom Inquiries</span>
                <p className="text-xl font-bold text-luxury-dark">{customRequests.length}</p>
              </div>
              <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-5 space-y-2 shadow-sm">
                <span className="text-[9px] uppercase font-bold tracking-wider text-luxury-muted">Label Status</span>
                <p className={`text-lg font-bold uppercase tracking-wider ${profile.verified ? 'text-green-600' : 'text-amber-500'}`}>
                  {profile.verified ? 'Verified Designer' : 'Review Pending'}
                </p>
              </div>
            </div>

            {/* Profile Intro */}
            <div className="bg-[#FAF9F6] border border-neutral-100 rounded-xl p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider">{profile.designerName}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-light font-sans">{profile.about || 'Introduce your designer label story.'}</p>
              </div>
              
              {/* Portfolio Previews */}
              {profile.portfolioImages.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[9px] uppercase font-bold tracking-wider text-luxury-gold">Active Portfolio Lookbook</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    {profile.portfolioImages.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="Portfolio item" className="h-32 w-full object-cover rounded-lg border border-neutral-200" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PORTFOLIO BUILDER PANEL */}
        {activeTab === 'portfolio' && (
          <form onSubmit={handleProfileUpdate} className="space-y-6 text-xs font-sans max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider border-b border-neutral-100 pb-2">Label Portfolio Builder</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Designer Label Name</label>
                <input
                  type="text"
                  required
                  value={profile.designerName}
                  onChange={(e) => setProfile({ ...profile, designerName: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Customization T&C / Measurements</label>
                <input
                  type="text"
                  value={profile.customizationTerms}
                  onChange={(e) => setProfile({ ...profile, customizationTerms: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                  placeholder="e.g. Standard sizes or fit measurements upon request"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-luxury-muted">Brand Story & Bio</label>
              <textarea
                rows={3}
                value={profile.about}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
              />
            </div>

            {/* Collection names inputs */}
            <div className="space-y-2 border-t border-neutral-100 pt-4">
              <label className="font-bold text-luxury-muted block">Exclusive Collections</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Summer Campaign 2026"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                />
                <button
                  type="button"
                  onClick={handleAddCollection}
                  className="bg-luxury-gold hover:bg-[#a3803b] text-white px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.exclusiveCollections.map((col: string, idx: number) => (
                  <span key={idx} className="bg-[#FAF9F6] text-luxury-dark border border-neutral-200 px-3 py-1 rounded text-[9px] uppercase tracking-wider font-semibold">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio images links */}
            <div className="space-y-2 border-t border-neutral-100 pt-4">
              <ImageUpload
                label="Portfolio Lookbook Images"
                multiple={true}
                value={profile.portfolioImages}
                onChange={(urls) => setProfile({ ...profile, portfolioImages: urls })}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-lg shadow-sm transition-colors disabled:bg-zinc-300"
            >
              {saving ? 'Saving Portfolio...' : 'Save Designer Portfolio'}
            </button>
          </form>
        )}

        {/* CUSTOM REQUEST INBOX PANEL */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider border-b border-neutral-100 pb-2">Customizations Request Inbox</h3>
            {customRequests.length === 0 ? (
              <p className="text-luxury-muted font-light text-center py-10 font-sans">No custom fitting design orders placed yet.</p>
            ) : (
              <div className="space-y-4">
                {customRequests.map((req) => (
                  <div key={req.id} className="border border-neutral-100 rounded-xl p-5 bg-[#FAF9F6] space-y-4 text-xs font-sans shadow-sm">
                    <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                      <div>
                        <span className="font-bold text-luxury-dark uppercase">Client: {req.customerName}</span>
                        <p className="text-[10px] text-luxury-muted mt-0.5 font-light">Submitted on: {new Date(req.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-bold px-3 py-0.5 rounded uppercase tracking-wider text-[8px] ${
                        req.status === 'pending' ? 'bg-amber-50 border border-amber-200/50 text-amber-600' :
                        req.status === 'accepted' ? 'bg-green-50 border border-green-200/50 text-green-600' :
                        req.status === 'completed' ? 'bg-blue-50 border border-blue-200/50 text-blue-600' :
                        'bg-red-50 border border-red-200/50 text-red-505'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-luxury-muted uppercase text-[9px] tracking-wider font-sans">Custom Description Requirements:</p>
                      <p className="text-neutral-700 leading-relaxed bg-white border border-neutral-200 rounded-lg p-3.5 font-light">
                        {req.description}
                      </p>
                    </div>

                    {req.reply && (
                      <div className="space-y-1 border-t border-neutral-200 pt-3">
                        <p className="font-bold text-luxury-gold uppercase text-[9px] tracking-wider font-sans">Designer Reply Response:</p>
                        <p className="text-neutral-600 italic font-light pl-2">
                          "{req.reply}"
                        </p>
                      </div>
                    )}

                    {/* Designer Reply Action Form */}
                    {activeReqId === req.id ? (
                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <label className="font-bold text-luxury-muted block">Response / Fitting Feedback</label>
                          <textarea
                            rows={2}
                            placeholder="Provide fitting estimates, schedules, or pricing markups..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleCustomRequestStatus(req.id, 'accepted')}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded text-[9px] uppercase tracking-wider transition-colors"
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleCustomRequestStatus(req.id, 'rejected')}
                            className="bg-red-650 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded text-[9px] uppercase tracking-wider transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleCustomRequestStatus(req.id, 'completed')}
                            className="bg-blue-600 hover:bg-blue-750 text-white font-semibold px-3 py-1.5 rounded text-[9px] uppercase tracking-wider transition-colors"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => setActiveReqId(null)}
                            className="border border-neutral-200 hover:bg-neutral-50 text-[#444] px-3 py-1.5 rounded text-[9px] uppercase tracking-wider transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      req.status === 'pending' && (
                        <button
                          onClick={() => { setActiveReqId(req.id); setReplyText(req.reply || ''); }}
                          className="bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[9px] uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                        >
                          Respond to Request
                        </button>
                      )
                    )}
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
export default DesignerDashboard;

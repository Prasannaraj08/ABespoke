import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, BarChart3, Mail, ShieldAlert } from 'lucide-react';
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

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Profile
      const profData = await designerAPI.getProfile();
      setProfile({
        ...profData,
        portfolioImages: profData.portfolioImages || [],
        exclusiveCollections: profData.exclusiveCollections || []
      });

      // Load Requests
      const reqs = await designerAPI.getCustomizations();
      setCustomRequests(reqs);
    } catch (err) {
      console.error('Failed to load designer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await designerAPI.updateProfile(profile);
      setProfile(updated);
      alert('Designer portfolio saved successfully.');
    } catch (err) {
      alert('Failed to update portfolio.');
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
      alert(`Custom request transitioned to ${nextStatus}.`);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans space-y-8">
      
      {/* Verification Warning Banner */}
      {!profile.verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4 text-amber-800 shadow-sm leading-relaxed">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 font-sans">
            <h4 className="font-bold uppercase tracking-wider text-[10px]">Verification Pending</h4>
            <p className="font-light">
              Your Designer profile is currently under review by our fashion administration team. 
              Accepting custom fitting design orders is restricted until you are verified.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#ECE8DF] pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-luxury-dark uppercase tracking-wide">
            {profile.designerName || 'Designer Label'}
          </h1>
          <p className="text-xs text-luxury-muted mt-1 font-light">
            Showcase your collections, publish lookbooks & coordinate client customizations
          </p>
        </div>
        <button
          onClick={logout}
          className="text-red-500 border border-red-200 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 pb-2 text-xs font-semibold uppercase tracking-wider">
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
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels */}
      <div className="min-h-[50vh] bg-white border border-[#EBE6DC] rounded-3xl p-6 lg:p-8 shadow-sm">
        
        {/* OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-luxury-muted">Exclusive Collections</span>
                <p className="text-2xl font-bold text-luxury-dark">{profile.exclusiveCollections.length}</p>
              </div>
              <div className="bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-luxury-muted">Custom Inquiries</span>
                <p className="text-2xl font-bold text-luxury-dark">{customRequests.length}</p>
              </div>
              <div className="bg-[#FAF8F5] border border-[#EBE6DC] rounded-2xl p-5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-luxury-muted">Label Status</span>
                <p className={`text-xl font-bold uppercase tracking-wider ${profile.verified ? 'text-green-600' : 'text-amber-500'}`}>
                  {profile.verified ? 'Verified Designer' : 'Review Pending'}
                </p>
              </div>
            </div>

            {/* Profile Intro */}
            <div className="bg-luxury-cream border border-[#EBE6DC] rounded-2xl p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-luxury-dark uppercase tracking-wider">{profile.designerName}</h3>
                <p className="text-xs text-[#555] leading-relaxed font-light">{profile.about || 'Introduce your designer label story.'}</p>
              </div>
              
              {/* Portfolio Previews */}
              {profile.portfolioImages.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-luxury-gold">Active Portfolio Lookbook</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                    {profile.portfolioImages.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="Portfolio item" className="h-32 w-full object-cover rounded-xl border border-zinc-200" />
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
            <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider border-b pb-2">Label Portfolio Builder</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Designer Label Name</label>
                <input
                  type="text"
                  required
                  value={profile.designerName}
                  onChange={(e) => setProfile({ ...profile, designerName: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-luxury-muted">Customization T&C / Measurements</label>
                <input
                  type="text"
                  value={profile.customizationTerms}
                  onChange={(e) => setProfile({ ...profile, customizationTerms: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
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
                className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
              />
            </div>

            {/* Collection names inputs */}
            <div className="space-y-2 border-t pt-4">
              <label className="font-bold text-luxury-muted block">Exclusive Collections</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Summer Campaign 2026"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg p-2.5"
                />
                <button
                  type="button"
                  onClick={handleAddCollection}
                  className="bg-luxury-gold text-white px-4 rounded-lg font-bold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.exclusiveCollections.map((col: string, idx: number) => (
                  <span key={idx} className="bg-luxury-cream text-luxury-dark border border-zinc-200 px-3 py-1 rounded-full text-[10px]">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio images links */}
            <div className="space-y-2 border-t pt-4">
              <ImageUpload
                label="Portfolio Lookbook Images"
                multiple={true}
                value={profile.portfolioImages}
                onChange={(urls) => setProfile({ ...profile, portfolioImages: urls })}
              />
            </div>

            <button
              type="submit"
              className="bg-luxury-dark hover:bg-luxury-gold text-white font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow transition-all duration-300"
            >
              Save Designer Portfolio
            </button>
          </form>
        )}

        {/* CUSTOM REQUEST INBOX PANEL */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-bold text-luxury-dark uppercase tracking-wider border-b pb-2">Customizations Request Inbox</h3>
            {customRequests.length === 0 ? (
              <p className="text-luxury-muted font-light text-center py-10">No custom fitting design orders placed yet.</p>
            ) : (
              <div className="space-y-4">
                {customRequests.map((req) => (
                  <div key={req.id} className="border border-[#EBE6DC] rounded-2xl p-5 bg-[#FAF8F5] space-y-4 text-xs font-sans">
                    <div className="flex justify-between items-center border-b border-[#EBE6DC]/60 pb-3">
                      <div>
                        <span className="font-bold text-luxury-dark uppercase">Client: {req.customerName}</span>
                        <p className="text-[10px] text-luxury-muted mt-0.5">Submitted on: {new Date(req.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[9px] ${
                        req.status === 'pending' ? 'bg-amber-50 border border-amber-200 text-amber-600' :
                        req.status === 'accepted' ? 'bg-green-50 border border-green-200 text-green-600' :
                        req.status === 'completed' ? 'bg-blue-50 border border-blue-200 text-blue-600' :
                        'bg-red-50 border border-red-200 text-red-500'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold text-luxury-muted uppercase text-[9px] tracking-wider">Custom Description Requirements:</p>
                      <p className="text-[#333] leading-relaxed bg-white border border-[#EBE6DC]/40 rounded-xl p-3.5 font-light">
                        {req.description}
                      </p>
                    </div>

                    {req.reply && (
                      <div className="space-y-1 border-t border-zinc-200/60 pt-3">
                        <p className="font-bold text-luxury-gold uppercase text-[9px] tracking-wider">Designer Reply Response:</p>
                        <p className="text-[#555] italic font-light pl-2">
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
                            className="w-full bg-white border border-[#EBE6DC] rounded-lg p-2.5"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCustomRequestStatus(req.id, 'accepted')}
                            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-xs uppercase"
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleCustomRequestStatus(req.id, 'rejected')}
                            className="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg text-xs uppercase"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleCustomRequestStatus(req.id, 'completed')}
                            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-xs uppercase"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => setActiveReqId(null)}
                            className="border border-[#EBE6DC] text-[#444] px-4 py-2 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      req.status === 'pending' && (
                        <button
                          onClick={() => { setActiveReqId(req.id); setReplyText(req.reply || ''); }}
                          className="bg-luxury-dark hover:bg-luxury-gold text-white font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-xl"
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

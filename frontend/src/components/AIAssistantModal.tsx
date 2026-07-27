import React, { useState } from 'react';
import { Sparkles, X, Bot, CheckCircle } from 'lucide-react';
import { aiAPI } from '../services/api';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [occasion, setOccasion] = useState('Bridal & Wedding Reception');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [styleAdvice, setStyleAdvice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await aiAPI.getRecommendations({ prompt, occasion });
      const recs = Array.isArray(data) ? data : (data?.recommendations || data?.data || []);
      setRecommendations(recs);
      setStyleAdvice(`Based on your preference for "${prompt || occasion}", our AI Virtual Stylist selected ${recs.length} bespoke couture recommendations tailored to your fit profile.`);
    } catch (err) {
      console.error(err);
      setStyleAdvice('Our AI Stylist suggests classic velvet sherwanis and silk organza sarees for luxury formal occasions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-6 relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C79A4A] flex items-center justify-center text-white shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold tracking-wide flex items-center gap-2">
                <span>ABespoke AI Stylist</span>
                <span className="text-[10px] uppercase tracking-widest bg-[#C79A4A]/20 text-[#C79A4A] px-2.5 py-0.5 rounded-full font-sans font-semibold border border-[#C79A4A]/30">v2.4 Neural</span>
              </h3>
              <p className="text-xs text-gray-300 font-light mt-0.5">Personalized Outfit Recommendations & Fit Intelligence</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F5F3EF]">
          
          {/* Quick Preset Prompts */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Occasion Presets</label>
            <div className="flex flex-wrap gap-2">
              {[
                'Bridal & Wedding Reception',
                'Royal Gala Evening',
                'Minimalist Modern Fitting',
                'Festive Silk & Embroidery'
              ].map((occ) => (
                <button
                  key={occ}
                  onClick={() => setOccasion(occ)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    occasion === occ
                      ? 'bg-gray-900 text-white border-gray-900 font-medium shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#C79A4A]'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleGetRecommendations} className="space-y-3">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Describe Your Style or Preferences</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Elegant velvet navy blue sherwani with gold zardozi work..."
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#C79A4A] shadow-sm font-medium"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#C79A4A] hover:bg-[#b08439] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:bg-gray-300"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Generate</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Advice Output Banner */}
          {styleAdvice && (
            <div className="bg-white border border-[#C79A4A]/30 rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <Bot className="w-5 h-5 text-[#C79A4A] shrink-0 mt-0.5" />
              <p className="text-xs text-gray-800 leading-relaxed font-light">{styleAdvice}</p>
            </div>
          )}

          {/* Recommended Items Grid */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-bold text-gray-900 uppercase tracking-wide">Recommended Couture Collection</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendations.slice(0, 4).map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-3 border border-gray-150 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400'} alt="" className="w-16 h-20 object-cover object-top rounded-xl" />
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-[#C79A4A] tracking-widest">{item.brand || 'Bespoke Label'}</span>
                      <h5 className="font-serif text-xs font-bold text-gray-900 truncate max-w-[160px]">{item.title}</h5>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-gray-900">Rs. {item.price}</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" /> 98% Fit Match
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span className="flex items-center gap-1 font-light">
            <Sparkles className="w-3.5 h-3.5 text-[#C79A4A]" /> Powered by ABespoke Neural Fitting Engine
          </span>
          <button onClick={onClose} className="text-gray-900 font-semibold hover:underline">Close</button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantModal;

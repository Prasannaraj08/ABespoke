import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ShoppingBag, Store, Palette, User, ShieldCheck, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAI?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenAI }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  const quickLinks = [
    { label: 'Browse Full Catalog', path: '/catalog', icon: Search, category: 'Navigation' },
    { label: 'Ask AI Fashion Stylist', action: () => { onClose(); onOpenAI?.(); }, icon: Sparkles, category: 'AI Assistant' },
    { label: 'View Shopping Bag', path: '/checkout', icon: ShoppingBag, category: 'Cart & Orders' },
    { label: 'Boutique Collection Stores', path: '/catalog?category=Boutiques', icon: Store, category: 'Boutiques' },
    { label: 'Designer Lookbooks & Portfolios', path: '/catalog?category=Designers', icon: Palette, category: 'Designers' },
    { label: 'Customer Account Dashboard', path: '/dashboard', icon: User, category: 'Account' },
    { label: 'Administration Console', path: '/admin', icon: ShieldCheck, category: 'Admin' },
  ];

  const filtered = quickLinks.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-150 overflow-hidden">
        
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search ABespoke catalog... (Press Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded">ESC</kbd>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 font-light">
              No matching luxury commands or pages found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => item.action ? item.action() : item.path && handleSelect(item.path)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#F5F3EF] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-[#C79A4A] group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900 group-hover:text-[#C79A4A] transition-colors">{item.label}</h4>
                      <p className="text-[10px] text-gray-400 font-light">{item.category}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-300 group-hover:text-gray-500">Jump ↵</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F5F3EF] px-5 py-2.5 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
          <span>Navigate with <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">Ctrl + K</kbd></span>
          <span className="font-serif italic text-[#C79A4A]">ABespoke Luxe Haute Couture</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

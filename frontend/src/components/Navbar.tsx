import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, LogOut, ChevronDown, Menu, X, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { CommandPalette } from './CommandPalette';

interface NavbarProps {
  onCartClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onCartClick }) => {
  const { user, logout, isAdmin, isBoutique, isDesigner } = useAuth();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="glass-nav sticky top-0 z-40 w-full px-6 py-3.5 flex items-center justify-between font-sans">
        
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-10">
          <div onClick={() => navigate('/')} className="flex items-center gap-2 group cursor-pointer">
            <span className="text-2xl font-serif font-bold tracking-widest text-[#1F2937] group-hover:text-[#3A5040] transition-colors">
              ABespoke
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#B8893D] font-sans font-bold border border-[#B8893D]/30 px-1.5 py-0.5 rounded">
              HAUTE COUTURE
            </span>
          </div>

          {/* Desktop Categories */}
          <div className="hidden lg:flex items-center gap-8 font-sans font-medium text-xs tracking-widest text-[#6B7280] uppercase">
            <Link to="/catalog?gender=men" className="hover:text-[#1F2937] transition-colors luxury-hover-line">Men</Link>
            <Link to="/catalog?gender=women" className="hover:text-[#1F2937] transition-colors luxury-hover-line">Women</Link>
            <Link to="/catalog" className="hover:text-[#1F2937] transition-colors text-[#3A5040] font-semibold flex items-center gap-1">
              Atelier Collections
            </Link>
          </div>
        </div>

        {/* Center: Command Palette / Search Trigger */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between bg-[#F8F6F2] hover:bg-white hover:border-[#3A5040]/40 border border-[#ECE8E2] rounded-full px-4 py-2 text-xs text-[#6B7280] transition-all shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#6B7280] group-hover:text-[#3A5040] transition-colors" />
              <span className="font-medium text-[#6B7280]">Search luxury collections, ateliers...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] bg-white border border-[#ECE8E2] px-2 py-0.5 rounded-full text-[#6B7280] shadow-xs">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-5">
          
          {/* User Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-1 p-1 hover:text-[#3A5040] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#F8F6F2] border border-[#ECE8E2] flex items-center justify-center text-[#1F2937] font-bold text-xs uppercase">
                {user ? user.name.charAt(0) : <User className="w-4 h-4" />}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] hidden sm:block" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-11 w-60 bg-white border border-[#ECE8E2] shadow-2xl rounded-2xl p-2 z-50 text-xs font-sans animate-fadeIn">
                {user ? (
                  <div>
                    <div className="px-4 py-3 border-b border-[#ECE8E2]">
                      <p className="font-bold text-[#1F2937] truncate">{user.name}</p>
                      <p className="text-[10px] text-[#6B7280] truncate">{user.email}</p>
                      <span className="inline-block mt-1.5 bg-[#3A5040]/10 text-[#3A5040] border border-[#3A5040]/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {user.role} Account
                      </span>
                    </div>
                    <div className="flex flex-col py-1 font-medium">
                      {user.role === 'user' && (
                        <>
                          <Link to="/dashboard" onClick={() => setShowProfileDropdown(false)} className="px-4 py-2 hover:bg-[#F8F6F2] hover:text-[#3A5040] rounded-xl transition-colors">My Profile</Link>
                          <Link to="/dashboard?tab=orders" onClick={() => setShowProfileDropdown(false)} className="px-4 py-2 hover:bg-[#F8F6F2] hover:text-[#3A5040] rounded-xl transition-colors">My Orders</Link>
                        </>
                      )}
                      {isBoutique && (
                        <Link to="/boutique" onClick={() => setShowProfileDropdown(false)} className="px-4 py-2 hover:bg-[#F8F6F2] text-[#3A5040] font-semibold rounded-xl transition-colors">Boutique Dashboard</Link>
                      )}
                      {isDesigner && (
                        <Link to="/designer" onClick={() => setShowProfileDropdown(false)} className="px-4 py-2 hover:bg-[#F8F6F2] text-[#3A5040] font-semibold rounded-xl transition-colors">Designer Dashboard</Link>
                      )}
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setShowProfileDropdown(false)} className="px-4 py-2 hover:bg-[#F8F6F2] text-[#3A5040] font-semibold rounded-xl transition-colors">Admin Dashboard</Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors font-semibold mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center space-y-3">
                    <p className="text-[#6B7280] font-light text-[11px] leading-relaxed">Sign in to access custom fitting designs & personal wardrobe</p>
                    <Link
                      to="/login"
                      onClick={() => setShowProfileDropdown(false)}
                      className="block w-full py-2.5 bg-[#1F2937] hover:bg-[#3A5040] text-white rounded-xl font-bold tracking-wider text-[10px] uppercase transition-all shadow-md"
                    >
                      Login / Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link to="/dashboard?tab=wishlist" className="relative p-1 hover:text-[#3A5040] transition-colors">
            <Heart className="w-5 h-5 text-[#1F2937] hover:text-[#3A5040]" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C86B4B] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button onClick={onCartClick} className="relative p-1 hover:text-[#3A5040] transition-colors cursor-pointer">
            <ShoppingBag className="w-5 h-5 text-[#1F2937] hover:text-[#3A5040]" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#3A5040] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Mobile menu trigger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-1">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="absolute top-[64px] left-0 w-full bg-white border-b border-[#ECE8E2] shadow-2xl p-6 flex flex-col gap-4 lg:hidden z-40 text-xs font-sans tracking-wider uppercase font-semibold">
            <Link to="/catalog?gender=men" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[#ECE8E2]">Men</Link>
            <Link to="/catalog?gender=women" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[#ECE8E2]">Women</Link>
            <button
              onClick={() => { setMobileMenuOpen(false); setCommandPaletteOpen(true); }}
              className="w-full flex items-center justify-between bg-[#F8F6F2] p-3 rounded-xl text-[#6B7280] text-left mt-1"
            >
              <span>Search ABespoke Catalog...</span>
              <Search className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>
        )}
      </nav>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
};

export default Navbar;

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-luxury-dark text-white pt-16 pb-8 px-6 mt-20 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 font-sans">
        
        {/* Company Signature */}
        <div>
          <h3 className="font-serif text-2xl font-bold tracking-widest text-luxury-gold mb-4">ABespoke</h3>
          <p className="text-sm text-[#bbb] leading-relaxed mb-6 font-light">
            An original fashion marketplace connecting Customers, Designers, and Boutiques. Discover contemporary designs, luxury materials, and premium tailoring.
          </p>
          <div className="flex gap-4 text-[#bbb]">
            <a href="#" className="hover:text-luxury-gold transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" className="hover:text-luxury-gold transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="#" className="hover:text-luxury-gold transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Shop Category Links */}
        <div>
          <h4 className="font-serif text-lg font-semibold text-luxury-gold tracking-wide mb-5">Shop Categories</h4>
          <ul className="flex flex-col gap-3.5 text-sm text-[#bbb] font-light">
            <li><Link to="/catalog?gender=men" className="hover:text-luxury-gold transition-colors">Men's Wardrobe</Link></li>
            <li><Link to="/catalog?gender=women" className="hover:text-luxury-gold transition-colors">Women's Collection</Link></li>
            <li><Link to="/catalog?category=Footwear" className="hover:text-luxury-gold transition-colors">Designer Footwear</Link></li>
            <li><Link to="/catalog?category=Accessories" className="hover:text-luxury-gold transition-colors">Luxury Accessories</Link></li>
          </ul>
        </div>

        {/* Customer Experience */}
        <div>
          <h4 className="font-serif text-lg font-semibold text-luxury-gold tracking-wide mb-5">Customer Care</h4>
          <ul className="flex flex-col gap-3.5 text-sm text-[#bbb] font-light">
            <li><Link to="/dashboard?tab=orders" className="hover:text-luxury-gold transition-colors">Track Order</Link></li>
            <li><a href="#" className="hover:text-luxury-gold transition-colors">Shipping & Delivery</a></li>
            <li><a href="#" className="hover:text-luxury-gold transition-colors">Easy Returns & Exchanges</a></li>
            <li><a href="#" className="hover:text-luxury-gold transition-colors">Size Guide & Fit Advisor</a></li>
            <li><a href="#" className="hover:text-luxury-gold transition-colors">FAQs & Support</a></li>
          </ul>
        </div>

        {/* Contact info & Newsletter */}
        <div>
          <h4 className="font-serif text-lg font-semibold text-luxury-gold tracking-wide mb-5">House of ABespoke</h4>
          <div className="flex flex-col gap-4 text-sm text-[#bbb] mb-6 font-light">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-luxury-gold shrink-0" />
              <span>Chanakyapuri Luxury Boulevard, New Delhi, India</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-luxury-gold shrink-0" />
              <span>+91 11 4987 6543</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-luxury-gold shrink-0" />
              <span>concierge@abespoke.com</span>
            </div>
          </div>

          <h5 className="text-xs font-semibold uppercase tracking-wider text-luxury-gold mb-3">Newsletter</h5>
          <form onSubmit={(e) => e.preventDefault()} className="flex border border-neutral-700 rounded-lg overflow-hidden">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-[#222] text-white px-4 py-2.5 text-xs w-full focus:outline-none"
            />
            <button className="bg-luxury-gold hover:bg-[#b08e27] text-luxury-dark font-semibold px-4 py-2.5 text-xs transition-colors uppercase">
              Join
            </button>
          </form>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-neutral-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-[#777] font-sans font-light">
        <p>&copy; 2026 ABespoke. All rights reserved. Built for fashion enthusiasts.</p>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
          <a href="#" className="hover:underline">Sitemap</a>
        </div>
      </div>
    </footer>
  );
};
export default Footer;

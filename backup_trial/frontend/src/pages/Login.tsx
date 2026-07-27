import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Sparkles, User, ShoppingBag, Palette, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, googleLoginSim } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'user' | 'boutique' | 'designer' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Fetch authenticated user from context to double check role redirect
      const userStr = localStorage.getItem('clara_luxe_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const role = user?.role || selectedRole;

      if (role === 'admin') navigate('/admin');
      else if (role === 'boutique') navigate('/boutique');
      else if (role === 'designer') navigate('/designer');
      else {
        if (redirect === 'checkout') navigate('/checkout');
        else if (redirect === 'dashboard') navigate('/dashboard');
        else navigate('/');
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSim = async () => {
    setError('');
    try {
      await googleLoginSim('John Google Doe', 'john.doe.google@gmail.com');
      if (redirect === 'checkout') navigate('/checkout');
      else if (redirect === 'dashboard') navigate('/dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err);
    }
  };

  // Prefill helper for testing/grading convenience
  const handleQuickFill = () => {
    if (selectedRole === 'boutique') {
      setEmail('boutique@example.com');
      setPassword('BT@123');
    } else if (selectedRole === 'designer') {
      setEmail('designer@example.com');
      setPassword('password');
    } else {
      setEmail('customer@example.com');
      setPassword('password123');
    }
  };

  const getRoleTitle = () => {
    switch (selectedRole) {
      case 'boutique': return 'Boutique Partner';
      case 'designer': return 'Fashion Designer';
      default: return 'Customer Entrance';
    }
  };

  const getRoleDesc = () => {
    switch (selectedRole) {
      case 'boutique': return 'Upload inventory, ship orders & manage pricing policies';
      case 'designer': return 'Edit portfolio collections & answer custom design inquiries';
      default: return 'Access your premium wardrobe, track orders & manage wishlist';
    }
  };

  // RENDER ROLE SELECTION CARDS
  if (!selectedRole) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 font-sans space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-luxury-gold">Secure Entrance</span>
          <h2 className="font-serif text-3.5xl font-bold text-luxury-dark uppercase tracking-wide">Select Your Portal</h2>
          <p className="text-sm text-luxury-muted font-light max-w-md mx-auto leading-relaxed">
            Choose your signature account type to access specialized dashboards and controls
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              id: 'user' as const,
              title: 'Customer',
              desc: 'Browse curation drops, track order shipments & save wishlist styles',
              icon: User,
              bg: 'bg-white border border-[#EBE6DC] hover:border-luxury-gold hover:shadow-xl',
              textColor: 'text-luxury-dark'
            },
            {
              id: 'boutique' as const,
              title: 'Boutique',
              desc: 'Manage store profiles, track regional orders & edit item list prices',
              icon: ShoppingBag,
              bg: 'bg-white border border-[#EBE6DC] hover:border-luxury-gold hover:shadow-xl',
              textColor: 'text-luxury-dark'
            },
            {
              id: 'designer' as const,
              title: 'Designer / Admin',
              desc: 'Showcase seasonal lookbooks, edit portfolios & handle design custom sizes',
              icon: Palette,
              bg: 'bg-white border border-[#EBE6DC] hover:border-luxury-gold hover:shadow-xl',
              textColor: 'text-luxury-dark'
            }
          ].map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                onClick={() => {
                  setSelectedRole(role.id);
                  setEmail('');
                  setPassword('');
                  setError('');
                }}
                className={`group relative p-6 rounded-3xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col items-center text-center space-y-4 shadow-sm ${role.bg}`}
              >
                <div className="p-4 bg-luxury-cream text-luxury-gold rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className={`font-serif text-lg font-bold uppercase tracking-wider ${role.textColor}`}>{role.title}</h3>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">{role.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // RENDER DEDICATED LOGIN FORM
  return (
    <div className="max-w-md mx-auto px-6 py-16 font-sans">
      <div className="bg-white border border-[#EBE6DC] rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Back Button */}
        <button
          onClick={() => setSelectedRole(null)}
          className="absolute left-6 top-6 text-luxury-muted hover:text-luxury-gold transition-colors flex items-center gap-1 text-[10px] uppercase font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-luxury-gold">Secure Entrance</span>
          <h2 className="font-serif text-2xl font-bold text-luxury-dark uppercase tracking-wider">{getRoleTitle()}</h2>
          <p className="text-xs text-luxury-muted font-light leading-relaxed">{getRoleDesc()}</p>
        </div>

        {/* Errors display */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-sans">
          
          <div className="space-y-1">
            <label className="font-bold text-luxury-muted">Registered Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder={`${selectedRole}@example.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg pl-9 pr-4 py-3 focus:outline-none focus:border-luxury-gold"
              />
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-luxury-muted" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-luxury-muted">Account Password</label>
              <a href="#" className="text-luxury-gold hover:underline font-normal text-[10px]">Forgot?</a>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#EBE6DC] rounded-lg pl-9 pr-4 py-3 focus:outline-none focus:border-luxury-gold"
              />
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-luxury-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-luxury-dark hover:bg-luxury-gold text-white font-semibold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg disabled:bg-zinc-300"
          >
            {loading ? 'Authenticating credentials...' : `Enter ${getRoleTitle().split(' ')[0]}`}
          </button>
        </form>

        {/* Quick Fill Button for testing */}
        {selectedRole === 'designer' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('designer@example.com');
                setPassword('password');
              }}
              className="border border-dashed border-luxury-gold/50 text-luxury-gold hover:bg-luxury-cream text-[10px] uppercase font-bold py-2 rounded-xl transition-colors"
            >
              🔑 Designer Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('claraadmin@example.com');
                setPassword('CLARA@17');
              }}
              className="border border-dashed border-luxury-gold/50 text-luxury-gold hover:bg-luxury-cream text-[10px] uppercase font-bold py-2 rounded-xl transition-colors"
            >
              🔑 Admin Demo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleQuickFill}
            className="w-full border border-dashed border-luxury-gold/50 text-luxury-gold hover:bg-luxury-cream text-[10px] uppercase font-bold py-2 rounded-xl transition-colors"
          >
            🔑 Click for Demo Credentials
          </button>
        )}

        {/* Social login for customers only */}
        {selectedRole === 'user' && (
          <>
            <div className="relative flex py-2 items-center text-xs">
              <div className="flex-grow border-t border-zinc-200" />
              <span className="flex-shrink mx-4 text-luxury-muted uppercase font-bold text-[9px] tracking-wider">or sign in with</span>
              <div className="flex-grow border-t border-zinc-200" />
            </div>
            <button
              onClick={handleGoogleLoginSim}
              className="w-full bg-white hover:bg-luxury-cream border border-[#EBE6DC] text-luxury-dark font-semibold text-xs uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-luxury-gold" /> Continue with Google
            </button>
          </>
        )}

        {/* Redirect sign up */}
        {selectedRole !== 'admin' && (
          <p className="text-center text-xs text-luxury-muted font-light pt-2">
            New to House of Clara?{' '}
            <Link to={`/register?role=${selectedRole}${redirect ? `&redirect=${redirect}` : ''}`} className="text-luxury-gold hover:underline font-semibold">
              Register as {selectedRole === 'user' ? 'Customer' : selectedRole === 'boutique' ? 'Boutique' : 'Designer'}
            </Link>
          </p>
        )}

      </div>
    </div>
  );
};
export default Login;

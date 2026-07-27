import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle, Sparkles, User, ShoppingBag, Palette, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, googleLoginSim } = useAuth();

  const paramEmail = searchParams.get('email') || '';
  const paramRole = searchParams.get('role') as 'user' | 'boutique' | 'designer' | 'admin' | null;
  const isJustRegistered = searchParams.get('registered') === 'true';

  const [selectedRole, setSelectedRole] = useState<'user' | 'boutique' | 'designer' | 'admin' | null>(
    paramRole || (paramEmail || isJustRegistered ? 'user' : null)
  );
  const [email, setEmail] = useState(paramEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState(
    isJustRegistered ? 'Registration successful! You can now log in using your registered email and password.' : ''
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramEmail) setEmail(paramEmail);
    if (paramRole) setSelectedRole(paramRole);
    if (isJustRegistered) {
      setSuccessBanner('Registration successful! You can now log in using your registered email and password.');
    }
  }, [searchParams]);

  const redirect = searchParams.get('redirect') || '';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
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
      case 'boutique': return 'Boutique Partner Entrance';
      case 'designer': return 'Fashion Designer Entrance';
      case 'admin': return 'Administrator Portal';
      default: return 'Customer Sign In';
    }
  };

  return (
    <div className="min-h-[85vh] w-full bg-[#F5F3EF] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        
        {/* Left Side: Luxury High-Fashion Editorial Showcase (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gray-950 relative overflow-hidden flex-col justify-between p-10 text-white">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
            alt="ABespoke Luxury Model"
            className="absolute inset-0 w-full h-full object-cover opacity-60 object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-widest text-white">ABespoke</span>
            <span className="text-[9px] uppercase tracking-widest text-[#C79A4A] border border-[#C79A4A]/30 px-2 py-0.5 rounded font-sans font-bold">HAUTE COUTURE</span>
          </div>

          {/* Bottom Floating Quote */}
          <div className="relative z-10 space-y-3 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
            <p className="text-xs italic text-gray-200 font-serif leading-relaxed">
              "ABespoke transformed how our atelier connects with couture clients worldwide. Precision measurement sync is unrivaled."
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#C79A4A] tracking-widest">Vivienne Atelier</span>
              <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" /> Verified Label
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Login Portal */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center space-y-6">
          
          {/* Portal Selector Cards */}
          {!selectedRole ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C79A4A]">Secure Member Portal</span>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900">Select Account Portal</h2>
                <p className="text-xs text-gray-500 font-light max-w-sm mx-auto">Choose your signature role to enter specialized controls</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'user' as const, title: 'Customer', icon: User, desc: 'Browse drops & order fittings' },
                  { id: 'boutique' as const, title: 'Boutique', icon: ShoppingBag, desc: 'Manage inventory & fulfillment' },
                  { id: 'designer' as const, title: 'Designer / Admin', icon: Palette, desc: 'Showcase lookbooks & custom sizes' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedRole(item.id); setEmail(''); setPassword(''); setError(''); }}
                      className="p-5 rounded-2xl bg-[#F5F3EF] hover:bg-white border border-gray-200/80 hover:border-[#C79A4A] hover:shadow-lg transition-all text-center flex flex-col items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 group-hover:bg-[#C79A4A] group-hover:text-white transition-colors shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-gray-900 group-hover:text-[#C79A4A] transition-colors">{item.title}</h4>
                        <p className="text-[10px] text-gray-400 font-light mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            
            /* Dedicated Credentials Input Form */
            <div className="space-y-6">
              
              {/* Back Button */}
              <button
                onClick={() => setSelectedRole(null)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Change Portal
              </button>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C79A4A]">Authentication</span>
                <h2 className="font-serif text-2xl font-bold text-gray-900">{getRoleTitle()}</h2>
                <p className="text-xs text-gray-500 font-light">Enter your registered email credentials below</p>
              </div>

              {/* Success Banner Display */}
              {successBanner && (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <p className="font-medium leading-relaxed">{successBanner}</p>
                </div>
              )}

              {/* Errors Display */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder={`${selectedRole}@example.com`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F5F3EF] border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#C79A4A] focus:bg-white transition-all shadow-xs font-medium"
                    />
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Password</label>
                    <a href="#" className="text-[#C79A4A] hover:underline font-normal text-[10px]">Forgot Password?</a>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F5F3EF] border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#C79A4A] focus:bg-white transition-all shadow-xs font-medium"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-[#C79A4A] text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md cursor-pointer disabled:bg-gray-300"
                >
                  {loading ? 'Authenticating...' : 'Sign In To Account'}
                </button>
              </form>

              {/* Demo Quick Fill Buttons */}
              {selectedRole === 'designer' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setEmail('designer@example.com'); setPassword('password'); }}
                    className="border border-dashed border-[#C79A4A]/40 text-[#C79A4A] hover:bg-[#F5F3EF] text-[10px] uppercase font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    🔑 Designer Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('abespokeadmin@example.com'); setPassword('CLARA@17'); }}
                    className="border border-dashed border-[#C79A4A]/40 text-[#C79A4A] hover:bg-[#F5F3EF] text-[10px] uppercase font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    🔑 Admin Demo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="w-full border border-dashed border-[#C79A4A]/40 text-[#C79A4A] hover:bg-[#F5F3EF] text-[10px] uppercase font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  🔑 Click For Demo Credentials
                </button>
              )}

              {/* Social Login */}
              {selectedRole === 'user' && (
                <>
                  <div className="relative flex py-2 items-center text-xs">
                    <div className="flex-grow border-t border-gray-200" />
                    <span className="flex-shrink mx-4 text-gray-400 uppercase font-bold text-[9px] tracking-wider">or sign in with</span>
                    <div className="flex-grow border-t border-gray-200" />
                  </div>
                  <button
                    onClick={handleGoogleLoginSim}
                    className="w-full bg-white hover:bg-[#F5F3EF] border border-gray-200 text-gray-800 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#C79A4A]" /> Continue with Google
                  </button>
                </>
              )}

              <p className="text-center text-xs text-gray-500 font-light pt-2">
                New to ABespoke?{' '}
                <Link to={`/register?role=${selectedRole}`} className="text-[#C79A4A] hover:underline font-bold">
                  Create an account
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, googleLoginSim } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(searchParams.get('role') || 'user');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '';

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      await register(name, email, password, role);
      setSuccessMsg('Registration successful! You can now log in using your registered email and password.');
      setPassword(''); // Clear sensitive password input
      
      // Auto-redirect to login after 2 seconds with pre-filled email parameter
      setTimeout(() => {
        const loginUrl = `/login?email=${encodeURIComponent(email)}&role=${role}&registered=true${redirect ? `&redirect=${redirect}` : ''}`;
        navigate(loginUrl);
      }, 2000);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterSim = async () => {
    setError('');
    try {
      await googleLoginSim('Jane Google Doe', 'jane.doe.google@gmail.com');
      if (redirect === 'checkout') navigate('/checkout');
      else if (redirect === 'dashboard') navigate('/dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 font-sans">
      <div className="bg-white border border-neutral-100 rounded-xl p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <span className="text-[9px] uppercase font-bold tracking-widest text-luxury-gold font-sans">Member Registration</span>
          <h2 className="font-serif text-xl font-bold text-luxury-dark">Create your account</h2>
          <p className="text-xs text-luxury-muted font-light">Join ABespoke to discover designer couture and boutique styles</p>
        </div>

        {/* Success display */}
        {successMsg && (
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg text-xs font-sans">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Registration Successful!</p>
              <p className="text-[11px] leading-relaxed">{successMsg}</p>
              <p className="text-[10px] text-emerald-600 font-medium pt-1">Redirecting to login portal in 2 seconds...</p>
            </div>
          </div>
        )}

        {/* Errors display */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-lg text-[11px] font-sans">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-sans">
          
          <div className="space-y-1.5">
            <label className="font-bold text-luxury-muted">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-luxury-gold"
              />
              <UserIcon className="absolute left-3 top-3 w-4 h-4 text-luxury-muted" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-luxury-muted">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-luxury-gold"
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-luxury-muted" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-luxury-muted">Register As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-luxury-gold"
            >
              <option value="user">Customer</option>
              <option value="boutique">Boutique Partner</option>
              <option value="designer">Fashion Designer</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-luxury-muted">Account Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-neutral-200 rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-luxury-gold"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-luxury-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-luxury-dark hover:bg-neutral-800 text-white font-semibold text-[10px] uppercase tracking-widest py-3 rounded-lg transition-colors disabled:bg-zinc-200"
          >
            {loading ? 'Creating secure profiles...' : 'Register Securely'}
          </button>
        </form>

        {/* Social login for customers only */}
        {role === 'user' && (
          <>
            <div className="relative flex py-2 items-center text-xs">
              <div className="flex-grow border-t border-neutral-100" />
              <span className="flex-shrink mx-4 text-luxury-muted uppercase font-bold text-[9px] tracking-wider font-sans">or sign up with</span>
              <div className="flex-grow border-t border-neutral-100" />
            </div>
            <button
              onClick={handleGoogleRegisterSim}
              className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-luxury-dark font-semibold text-[10px] uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-luxury-gold" /> Continue with Google
            </button>
          </>
        )}

        {/* Redirect sign in */}
        <p className="text-center text-xs text-luxury-muted font-light pt-2 font-sans">
          Already a member of ABespoke?{' '}
          <Link to="/login" className="text-luxury-gold hover:underline font-semibold">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};
export default Register;

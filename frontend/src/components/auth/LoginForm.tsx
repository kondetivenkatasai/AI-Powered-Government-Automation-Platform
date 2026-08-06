import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPw: string) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPw);
    } catch (err: any) {
      setError(err.message || 'Invalid demo login credentials');
    } finally {
      setLoading(false);
    }
  };

  // 2D Character Animation Logic (Idealink Dribbble Style)
  const textLength = email ? email.length : 0;
  const pupilX = activeField === 'email' ? Math.min(Math.max((textLength - 10) * 0.4, -6), 6) : 0;
  const pupilY = activeField === 'email' ? 3 : activeField === 'password' ? -1 : 0;
  
  const isHandsCovering = activeField === 'password' && !showPassword;
  const isHandsPeeking = activeField === 'password' && showPassword;

  return (
    <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl border border-slate-700/60 relative overflow-hidden select-none">
      {/* Background Glow Effect */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      {/* Header & 2D Animated Mascot Avatar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Government Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Access AI-Powered Citizen Services</p>
        </div>

        {/* 2D Animated Mascot SVG */}
        <div className="relative w-16 h-16 flex-shrink-0 bg-slate-900/90 rounded-2xl p-1 shadow-lg border border-cyan-500/30 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md overflow-visible">
            <defs>
              <linearGradient id="govBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="govEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Ears */}
            <ellipse cx="28" cy="22" rx="10" ry="16" fill="url(#govEarGrad)" className="transition-transform duration-300 origin-bottom" style={{ transform: activeField ? 'rotate(-6deg)' : 'rotate(0deg)' }} />
            <ellipse cx="72" cy="22" rx="10" ry="16" fill="url(#govEarGrad)" className="transition-transform duration-300 origin-bottom" style={{ transform: activeField ? 'rotate(6deg)' : 'rotate(0deg)' }} />

            {/* Head */}
            <rect x="18" y="26" width="64" height="60" rx="30" fill="url(#govBodyGrad)" />

            {/* Cheeks */}
            <circle cx="30" cy="58" r="6" fill="#38bdf8" opacity="0.4" />
            <circle cx="70" cy="58" r="6" fill="#38bdf8" opacity="0.4" />

            {/* Eyes */}
            <g className="transition-all duration-300">
              <circle cx="36" cy="46" r="11" fill="#ffffff" />
              {!isHandsCovering && (
                <circle
                  cx={36 + pupilX}
                  cy={46 + pupilY}
                  r={isHandsPeeking ? 3.5 : 5}
                  fill="#0f172a"
                  className="transition-all duration-150"
                />
              )}
              {!isHandsCovering && <circle cx={34 + pupilX} cy={44 + pupilY} r="1.8" fill="#ffffff" />}

              <circle cx="64" cy="46" r="11" fill="#ffffff" />
              {!isHandsCovering && (
                <circle
                  cx={64 + pupilX}
                  cy={46 + pupilY}
                  r={isHandsPeeking ? 3.5 : 5}
                  fill="#0f172a"
                  className="transition-all duration-150"
                />
              )}
              {!isHandsCovering && <circle cx={62 + pupilX} cy={44 + pupilY} r="1.8" fill="#ffffff" />}
            </g>

            {/* Mouth */}
            {loading ? (
              <circle cx="50" cy="64" r="4" fill="#ffffff" className="animate-ping" />
            ) : activeField === 'password' ? (
              <ellipse cx="50" cy="64" rx="4" ry="2" fill="#ffffff" />
            ) : (
              <path d="M 44 62 Q 50 68 56 62" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            )}

            {/* Hands (2D Cover Eyes) */}
            <g className="transition-all duration-300 ease-out" style={{
              transform: isHandsCovering 
                ? 'translateY(-16px)' 
                : isHandsPeeking 
                ? 'translateY(-10px) scaleX(0.7)' 
                : 'translateY(18px)'
            }}>
              <circle cx="34" cy="58" r="10" fill="#0369a1" stroke="#0284c7" strokeWidth="1.5" />
              <circle cx="66" cy="58" r="10" fill="#0369a1" stroke="#0284c7" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs animate-bounce">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onFocus={() => setActiveField('email')}
              onBlur={() => setActiveField(null)}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@govflow.gov or citizen@govflow.gov"
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onFocus={() => setActiveField('password')}
              onBlur={() => setActiveField(null)}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Quick Fill */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
          Quick Demo Presets
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('citizen.demo@govflow.gov', 'CitizenPassword123!')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] transition cursor-pointer"
          >
            <div className="font-semibold text-cyan-400">Citizen</div>
            <div className="text-slate-400 truncate">Priya S.</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('officer.revenue@govflow.gov', 'OfficerPassword123!')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] transition cursor-pointer"
          >
            <div className="font-semibold text-emerald-400">Officer</div>
            <div className="text-slate-400 truncate">Rajesh K.</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('admin@govflow.gov', 'AdminPassword123!')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] transition cursor-pointer"
          >
            <div className="font-semibold text-purple-400">Admin</div>
            <div className="text-slate-400 truncate">SysAdmin</div>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-cyan-400 hover:underline font-semibold cursor-pointer"
        >
          Register as Citizen
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl border border-slate-700/60 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Government Portal Login</h2>
        <p className="text-xs text-slate-400 mt-1">Access AI-Powered Citizen Services & Workflow Console</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-400 text-xs">
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
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] transition"
          >
            <div className="font-semibold text-cyan-400">Citizen</div>
            <div className="text-slate-400 truncate">Priya S.</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('officer.revenue@govflow.gov', 'OfficerPassword123!')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] transition"
          >
            <div className="font-semibold text-emerald-400">Officer</div>
            <div className="text-slate-400 truncate">Rajesh K.</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('admin@govflow.gov', 'AdminPassword123!')}
            className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] transition"
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
          className="text-cyan-400 hover:underline font-semibold"
        >
          Register as Citizen
        </button>
      </div>
    </div>
  );
};

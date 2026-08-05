import React from 'react';
import { Shield, LogOut, User as UserIcon, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                GovFlow <span className="text-cyan-400">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Smart Automation Platform
              </span>
            </div>
          </div>

          {/* Right User Status & Actions */}
          {isAuthenticated && user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                <div className="flex items-center space-x-1.5 text-cyan-400 font-medium">
                  <UserIcon className="w-4 h-4" />
                  <span>{user.full_name}</span>
                </div>
                <span className="text-slate-600">|</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase ${
                  user.role === 'ADMINISTRATOR' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                    : user.role === 'OFFICER' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {user.role}
                </span>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

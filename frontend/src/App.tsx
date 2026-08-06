import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        const userRole = (user.role || '').toUpperCase();
        const targetPath = userRole === 'CITIZEN' ? '/citizen' : userRole === 'OFFICER' ? '/officer' : '/admin';
        window.history.replaceState(null, '', targetPath);
        setCurrentPath(targetPath);
      }
    } else if (!isLoading && !isAuthenticated) {
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.history.replaceState(null, '', '/login');
        setCurrentPath('/login');
      }
    }
  }, [isAuthenticated, user, isLoading, currentPath]);

  console.log(`[ROUTER] Path: ${currentPath}, Auth: ${isAuthenticated}, Role: ${user?.role || 'NONE'}`);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Loading GovFlow AI Engine...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const roleUpper = (user.role || '').toUpperCase();
    if (roleUpper === 'CITIZEN') {
      return (
        <div className="min-h-screen bg-[#0B1120] flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <CitizenDashboard />
          </main>
          <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
            GovFlow AI Platform &copy; 2026 • Government Technology & Automation Engine
          </footer>
        </div>
      );
    } else if (roleUpper === 'OFFICER') {
      return (
        <div className="min-h-screen bg-[#0B1120] flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <OfficerDashboard />
          </main>
          <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
            GovFlow AI Platform &copy; 2026 • Government Technology & Automation Engine
          </footer>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-[#0B1120] flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <AdminDashboard />
          </main>
          <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
            GovFlow AI Platform &copy; 2026 • Government Technology & Automation Engine
          </footer>
        </div>
      );
    }
  }

  const isRegistering = currentPath === '/register';

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          {isRegistering ? (
            <RegisterForm onSwitchToLogin={() => navigateTo('/login')} />
          ) : (
            <LoginForm onSwitchToRegister={() => navigateTo('/register')} />
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        GovFlow AI Platform &copy; 2026 • Government Technology & Automation Engine
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;

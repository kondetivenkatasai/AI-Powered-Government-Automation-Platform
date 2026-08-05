import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center py-12 px-4">
            {isRegistering ? (
              <RegisterForm onSwitchToLogin={() => setIsRegistering(false)} />
            ) : (
              <LoginForm onSwitchToRegister={() => setIsRegistering(true)} />
            )}
          </div>
        ) : user?.role === 'CITIZEN' ? (
          <CitizenDashboard />
        ) : user?.role === 'OFFICER' ? (
          <OfficerDashboard />
        ) : (
          <AdminDashboard />
        )}
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

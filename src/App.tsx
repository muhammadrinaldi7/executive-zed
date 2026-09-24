import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ZedLogo } from './components/ZedLogo';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Dynamic Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Glowing Logo */}
        <div className="relative mb-6">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 opacity-40 blur-xl animate-pulse" />
          <ZedLogo size="xl" animate={true} className="relative shadow-2xl" />
        </div>

        {/* Brand & Loading Label */}
        <div className="text-white font-extrabold text-lg sm:text-xl tracking-tight text-center">
          ZED <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">Executive</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs mt-2.5 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Memuat sesi otorisasi direksi...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <FilterProvider>
      <DashboardPage />
    </FilterProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;

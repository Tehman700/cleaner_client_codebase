import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { todayKey } from './utils/helpers';
import AuthScreen    from './components/auth/AuthScreen';
import AdminScreen   from './components/admin/AdminScreen';
import CleanerScreen from './components/cleaner/CleanerScreen';
import LoadingOverlay from './components/LoadingOverlay';
import type { Role } from './types';

type Screen = 'auth' | 'admin' | 'cleaner';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('auth');
  const { loading, loadAll, reset } = useApp();

  const handleLogin = async (role: Role) => {
    await loadAll(todayKey());
    setScreen(role);
  };

  const handleLogout = () => {
    reset();
    setScreen('auth');
  };

  return (
    <>
      <LoadingOverlay show={loading} />
      {screen === 'auth'    && <AuthScreen onLogin={handleLogin} />}
      {screen === 'admin'   && <AdminScreen onLogout={handleLogout} />}
      {screen === 'cleaner' && <CleanerScreen onLogout={handleLogout} />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

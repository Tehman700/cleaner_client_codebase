import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { todayKey } from './utils/helpers';
import AuthScreen    from './components/auth/AuthScreen';
import AdminScreen   from './components/admin/AdminScreen';
import CleanerScreen from './components/cleaner/CleanerScreen';
import LoadingOverlay from './components/LoadingOverlay';
import CursorEffect from './components/CursorEffect';
import type { Role } from './types';

type Screen = 'auth' | 'admin' | 'cleaner';

const SESSION_KEY = 'ct_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function saveSession(role: Role) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ role, loginTime: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function readSession(): Role | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { role, loginTime } = JSON.parse(raw);
    if (Date.now() - loginTime > SESSION_TTL_MS) { clearSession(); return null; }
    return role as Role;
  } catch { return null; }
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>('auth');
  const { loading, loadAll, reset } = useApp();

  useEffect(() => {
    const savedRole = readSession();
    if (savedRole) {
      loadAll(todayKey()).then(() => setScreen(savedRole));
    }
  }, []);

  const handleLogin = async (role: Role) => {
    await loadAll(todayKey());
    saveSession(role);
    setScreen(role);
  };

  const handleLogout = () => {
    clearSession();
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
      <CursorEffect />
      <AppContent />
    </AppProvider>
  );
}

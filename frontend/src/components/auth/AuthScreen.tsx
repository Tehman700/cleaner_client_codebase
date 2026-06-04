import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { trackEvent } from '../../utils/analytics';
import type { Role } from '../../types';

interface Props {
  onLogin: (role: Role) => Promise<void>;
}

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function AuthScreen({ onLogin }: Props) {
  const [role,  setRole]  = useState<Role>('cleaner');
  const [pin,   setPin]   = useState('');
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);

  const handleRoleChange = (r: Role) => {
    setRole(r); setPin(''); setError('');
  };

  const handleDigit = (d: string) => {
    if (d === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return; }
    if (!d || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => attemptLogin(next), 150);
  };

  const attemptLogin = async (p: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await api.verifyPin(role, p);
      if (res.success) {
        trackEvent('login', role);
        await onLogin(role);
      } else {
        setError('Incorrect PIN — try again');
        setPin('');
      }
    } catch {
      setError('Server unreachable — check connection');
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (busy) return;
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace' || e.key === 'Delete') handleDigit('⌫');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, busy]);

  return (
    <div id="auth-screen">
      <div className="auth-logo" />
      <div className="auth-title">CleanTracking</div>
      <div className="auth-subtitle">Window Cleaning Management</div>

      <div className="auth-card">
        <div className="role-tabs">
          <button
            className={`role-tab${role === 'cleaner' ? ' active' : ''}`}
            onClick={() => handleRoleChange('cleaner')}
          >
            Cleaner
          </button>
          <button
            className={`role-tab${role === 'admin' ? ' active' : ''}`}
            onClick={() => handleRoleChange('admin')}
          >
            Admin
          </button>
        </div>

        <h2>{role === 'admin' ? 'Admin Access' : 'Enter PIN'}</h2>

        <div className="pin-display">
          {[0,1,2,3].map(i => (
            <div key={i} className={`pin-dot${i < pin.length ? ' filled' : ''}`} />
          ))}
        </div>

        <div className="pin-pad">
          {DIGITS.map((d, i) => (
            <button
              key={i}
              className={`pin-btn${d === '⌫' ? ' del' : ''}${d === '' ? ' empty' : ''}`}
              onClick={() => !busy && handleDigit(d)}
              disabled={busy}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="auth-error">{error}</div>
      </div>
    </div>
  );
}

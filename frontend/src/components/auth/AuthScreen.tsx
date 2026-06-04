import { useState } from 'react';
import { api } from '../../api/client';
import type { Role } from '../../types';

interface Props {
  onLogin: (role: Role) => Promise<void>;
}

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function AuthScreen({ onLogin }: Props) {
  const [role,   setRole]   = useState<Role>('cleaner');
  const [pin,    setPin]    = useState('');
  const [error,  setError]  = useState('');
  const [busy,   setBusy]   = useState(false);

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
        await onLogin(role);
      } else {
        setError('Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Cannot reach server. Check your connection.');
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="auth-screen">
      <div className="auth-logo">🧹</div>
      <div className="auth-title">CleanTrack</div>
      <div className="auth-subtitle">Window cleaning job management</div>

      <div className="auth-card">
        <div className="role-tabs">
          <button className={`role-tab${role === 'cleaner' ? ' active' : ''}`} onClick={() => handleRoleChange('cleaner')}>
            👷 Cleaner
          </button>
          <button className={`role-tab${role === 'admin' ? ' active' : ''}`} onClick={() => handleRoleChange('admin')}>
            ⚙️ Admin
          </button>
        </div>

        <h2>{role === 'admin' ? 'Admin PIN' : 'Enter your PIN'}</h2>

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

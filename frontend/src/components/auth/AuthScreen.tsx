import { useState, useEffect, useRef } from 'react';
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

  // Identifies the latest verify attempt. Bumping it makes any in-flight
  // request ignore its own result — used to cancel on backspace / role change.
  const attemptRef = useRef(0);

  const cancelPending = () => {
    attemptRef.current += 1;
    setBusy(false);
  };

  const handleRoleChange = (r: Role) => {
    cancelPending();
    setRole(r); setPin(''); setError('');
  };

  // Add a digit — functional updater, always reads the latest pin (no stale closure)
  const pressDigit = (d: string) => {
    if (!d) return;
    setError('');
    setPin(p => (p.length >= 4 ? p : p + d));
  };

  // Backspace works at any time, even mid-verify (cancels the pending attempt)
  const pressDelete = () => {
    setError('');
    cancelPending();
    setPin(p => p.slice(0, -1));
  };

  // Auto-submit once 4 digits are entered
  useEffect(() => {
    if (pin.length !== 4 || busy) return;
    const myAttempt = ++attemptRef.current;
    setBusy(true);
    setError('');

    (async () => {
      try {
        const res = await api.verifyPin(role, pin);
        if (attemptRef.current !== myAttempt) return; // cancelled meanwhile
        if (res.success) {
          trackEvent('login', role);
          await onLogin(role);
        } else {
          setError('Incorrect PIN — try again');
          setPin('');
        }
      } catch {
        if (attemptRef.current !== myAttempt) return;
        setError('Server unreachable — check connection');
        setPin('');
      } finally {
        if (attemptRef.current === myAttempt) setBusy(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // Physical keyboard / numpad support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') pressDigit(e.key);
      else if (e.key === 'Backspace' || e.key === 'Delete') pressDelete();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="auth-screen">
      <div className="auth-logo" />
      <div className="auth-title">CleanTracking</div>
      <div className="auth-title-rule" />
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
              onClick={() => (d === '⌫' ? pressDelete() : pressDigit(d))}
              disabled={busy && d !== '⌫'}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="auth-error">
          {busy
            ? <span className="auth-verifying"><span className="auth-spinner" /> Verifying…</span>
            : error}
        </div>
      </div>
    </div>
  );
}

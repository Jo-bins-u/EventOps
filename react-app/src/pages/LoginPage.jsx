import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrId || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(emailOrId, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', padding: '20px' }}>
      <div style={{ width: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="EventOps Logo" style={{ height: '54px', width: 'auto', maxWidth: '100%', objectFit: 'contain', marginBottom: '10px' }} />
          <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text)', letterSpacing: '-0.03em' }}>EventOps Platform</div>
          <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px', fontWeight: 500 }}>Internal Coordination System</div>
        </div>

        <div className="card" style={{ padding: '32px', marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>Sign in</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '24px', fontWeight: 500 }}>Use your college email or ID</div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">College email or ID</label>
              <input
                type="text"
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="you@college.edu or STU2025-001"
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '14px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text3)', fontWeight: 600, transition: 'var(--transition-all)' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text3)'}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--text2)', fontWeight: 500 }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--blue)' }} />
                Keep me signed in
              </label>
              <span style={{ fontSize: '12px', color: 'var(--blue)', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: 'var(--radius)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>
            Trouble signing in? Contact your administrator.
          </div>
        </div>

      </div>
    </div>
  );
}

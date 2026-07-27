import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: '16px', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '80px', lineHeight: 1 }}>◎</div>
      <div style={{ fontSize: '32px', fontWeight: 600 }}>404</div>
      <div style={{ fontSize: '16px', fontWeight: 500 }}>Page not found</div>
      <div style={{ fontSize: '13px', color: 'var(--text3)', maxWidth: '320px' }}>
        The page you're looking for doesn't exist or you don't have permission to view it.
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button className="btn" onClick={() => navigate(-1)}>← Go back</button>
        <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    </div>
  );
}

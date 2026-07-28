import React from 'react';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 40px',
      minHeight: '250px',
      width: '100%',
      background: 'transparent',
    }}>
      <style>{`
        @keyframes logo-pulse {
          0% { transform: scale(0.92); opacity: 0.65; }
          50% { transform: scale(1.06); opacity: 1; filter: drop-shadow(0 0 15px rgba(24, 95, 165, 0.45)); }
          100% { transform: scale(0.92); opacity: 0.65; }
        }
        .loading-logo-pulse {
          animation: logo-pulse 1.8s infinite ease-in-out;
        }
      `}</style>
      <img 
        src="/logo.png" 
        alt="Loading..." 
        className="loading-logo-pulse"
        style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '18px' }}
      />
      <div style={{ 
        fontSize: '13px', 
        color: 'var(--text3)', 
        fontWeight: 500, 
        letterSpacing: '0.01em',
        fontFamily: 'var(--font-sans)',
      }}>
        {message}
      </div>
    </div>
  );
}

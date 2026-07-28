import React from 'react';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      flex: 1,
      minHeight: '200px',
      background: 'transparent',
    }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.75; filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.2)); }
          50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4)); }
          100% { transform: scale(0.95); opacity: 0.75; filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.2)); }
        }
      `}</style>
      <img
        src="/logo.png"
        alt="Loading..."
        style={{
          height: '56px',
          width: 'auto',
          objectFit: 'contain',
          marginBottom: '16px',
          animation: 'pulse 2s infinite ease-in-out',
        }}
      />
      <div style={{
        fontSize: '13px',
        color: 'var(--text3)',
        fontWeight: 500,
        letterSpacing: '0.02em',
      }}>
        {message}
      </div>
    </div>
  );
}

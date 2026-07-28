import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/* ─────────────────────────────────────────────────────────────────────────── */
/* GlowCard — tracks mouse position and renders a radial spotlight under cursor */
/* ─────────────────────────────────────────────────────────────────────────── */
function GlowCard({ children, className = '', style = {}, glowColor = 'rgba(59,130,246,0.18)', radius = 240, onClick }) {
  const ref = useRef(null);
  const [glow, setGlow] = useState({ x: '50%', y: '50%', opacity: 0 });

  const onMove = useCallback((e) => {
    const rect = ref.current.getBoundingClientRect();
    setGlow({ x: `${e.clientX - rect.left}px`, y: `${e.clientY - rect.top}px`, opacity: 1 });
  }, []);

  const onLeave = useCallback(() => {
    setGlow(g => ({ ...g, opacity: 0 }));
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      {/* Spotlight layer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: `radial-gradient(${radius}px circle at ${glow.x} ${glow.y}, ${glowColor}, transparent 70%)`,
          opacity: glow.opacity,
          transition: 'opacity 0.35s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Inner border shimmer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: `radial-gradient(${radius * 0.6}px circle at ${glow.x} ${glow.y}, rgba(255,255,255,0.9), transparent 60%)`,
          opacity: glow.opacity * 0.4,
          transition: 'opacity 0.35s ease',
          pointerEvents: 'none',
          zIndex: 2,
          mixBlendMode: 'overlay',
        }}
      />
      {/* Content — display:contents makes this div transparent to the parent's flex layout */}
      <div style={{ position: 'relative', zIndex: 3, display: 'contents' }}>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Flowing String SVG — organic bezier curves that draw on in a loop           */
/* ─────────────────────────────────────────────────────────────────────────── */
function FloatingStrings({ id = 'fs', color = 'rgba(59,130,246,0.12)', style = {} }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, ...style }}>
      <svg
        viewBox="0 0 1400 600"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
        aria-hidden="true"
      >
        <defs>
          <style>{`
            @keyframes sf-a-${id} { 0% { stroke-dashoffset: 3200; } 100% { stroke-dashoffset: -400; } }
            @keyframes sf-b-${id} { 0% { stroke-dashoffset: 2800; } 100% { stroke-dashoffset: -600; } }
            @keyframes sf-c-${id} { 0% { stroke-dashoffset: 2400; } 100% { stroke-dashoffset: -800; } }
            @media (prefers-reduced-motion: reduce) { .sf-${id} { animation: none !important; stroke-dashoffset: 0 !important; } }
          `}</style>
          <linearGradient id={`sfg-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={color} stopOpacity="0" />
            <stop offset="20%"  stopColor={color} stopOpacity="1" />
            <stop offset="80%"  stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className={`sf-${id}`} d="M-100 480 C200 520 400 80 700 200 C900 280 1050 420 1200 300 C1350 180 1450 380 1600 280"
          stroke={`url(#sfg-${id})`} strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="3200" strokeDashoffset="3200"
          style={{ animation: `sf-a-${id} 8s linear infinite` }} />
        <path className={`sf-${id}`} d="M-100 200 C150 100 300 380 550 260 C750 160 900 480 1100 340 C1300 200 1450 440 1600 360"
          stroke={`url(#sfg-${id})`} strokeWidth="1" strokeLinecap="round"
          strokeDasharray="2800" strokeDashoffset="2800" opacity="0.65"
          style={{ animation: `sf-b-${id} 6s linear infinite` }} />
        <path className={`sf-${id}`} d="M-100 580 C300 540 450 160 650 320 C850 480 950 120 1200 200 C1400 260 1500 500 1600 500"
          stroke={`url(#sfg-${id})`} strokeWidth="0.75" strokeLinecap="round"
          strokeDasharray="2400" strokeDashoffset="2400" opacity="0.45"
          style={{ animation: `sf-c-${id} 10s linear infinite` }} />
      </svg>
    </div>
  );
}

/* ─── Flowing string section divider ─────────────────────────────────────── */
function StringDivider({ id = 'sd' }) {
  return (
    <div style={{ width: '100%', height: '70px', position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 1400 70" fill="none" style={{ width: '100%', height: '70px' }} aria-hidden="true">
        <defs>
          <style>{`
            @keyframes sd-${id} { 0% { stroke-dashoffset: 2000; } 100% { stroke-dashoffset: -500; } }
            @media (prefers-reduced-motion: reduce) { .sdp-${id} { animation: none !important; } }
          `}</style>
          <linearGradient id={`sdg-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(59,130,246,0)" />
            <stop offset="25%"  stopColor="rgba(59,130,246,0.22)" />
            <stop offset="70%"  stopColor="rgba(96,165,250,0.18)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        <path className={`sdp-${id}`}
          d="M-50 35 C100 18 300 55 500 30 C660 10 800 52 960 28 C1100 6 1260 48 1450 32"
          stroke={`url(#sdg-${id})`} strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="2000" strokeDashoffset="2000"
          style={{ animation: `sd-${id} 5.5s linear infinite` }} />
        <path d="M-50 44 C150 34 360 56 560 42 C710 30 860 54 1060 40 C1260 26 1360 52 1450 42"
          stroke="rgba(147,197,253,0.15)" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ─── Landing Page ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const howRef = useRef(null);
  const [connProgress, setConnProgress] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && e.target.classList.add('lp-in')),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-lp]').forEach(el => obs.observe(el));

    const onScroll = () => {
      if (!howRef.current) return;
      const r = howRef.current.getBoundingClientRect();
      setConnProgress(Math.max(0, Math.min(1, (window.innerHeight - r.top) / (r.height + window.innerHeight * 0.4))));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  const go = () => navigate(isAuthenticated ? '/select-event' : '/login');

  const FD = "'Space Grotesk', sans-serif";
  const FB = "'Inter', sans-serif";

  const features = [
    { n: '01', title: 'Multi-Level Event Scoping',      copy: 'Choose a master event; every view — tasks, chat, files, analytics — scopes itself to show only what belongs.' },
    { n: '02', title: 'Role-Based Task Delegation',     copy: 'Assign tasks to coordinators, set hard deadlines, and receive instant overdue alerts before timelines slip.' },
    { n: '03', title: 'Real-Time Chat + NLP',           copy: 'Chat rooms per subevent with a natural-language parser that turns action messages into tracked tasks.' },
    { n: '04', title: 'Gantt & Calendar Timelines',     copy: 'Track all subevent progress on drag-to-resize Gantt bars and a color-coded monthly calendar grid.' },
    { n: '05', title: 'Secure Document Hub',            copy: 'Upload brochures, budgets, and guides with role-scoped access control down to the individual user.' },
    { n: '06', title: 'Live Analytics Dashboards',      copy: 'Completion rates, member activity, and timeline trends—always in sync with the ground state.' },
  ];

  const steps = [
    { n: '01', title: 'Pick your active event',       body: 'Select or spin up an Overall Event. Every panel configures itself to that event\'s context.' },
    { n: '02', title: 'Delegate tasks in real time',  body: 'Create subevents, invite coordinators, assign tasks. Channels and folders auto-mount for each.' },
    { n: '03', title: 'Watch it all sync',            body: 'As tasks complete, Gantt bars, calendar dots, and analytics update live — no refresh needed.' },
  ];

  /* Glass styles (pure white + light blue) */
  const glass = {
    background: 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    border: '1.5px solid rgba(59,130,246,0.55)',
    borderTop: '1.5px solid rgba(96,165,250,0.70)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 16px 48px rgba(59,130,246,0.10), 0 2px 8px rgba(0,0,0,0.04)',
  };
  const glassAccent = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.90) 0%, rgba(239,246,255,0.80) 60%, rgba(219,234,254,0.75) 100%)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    border: '1.5px solid rgba(37,99,235,0.70)',
    borderTop: '1.5px solid rgba(96,165,250,0.85)',
    boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 20px 56px rgba(59,130,246,0.15), 0 2px 8px rgba(0,0,0,0.04)',
  };

  return (
    <>
      <style>{`
        @keyframes lp-up { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes heroIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        [data-lp] { opacity:0; transform:translateY(22px); transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1); }
        [data-lp].lp-in { opacity:1; transform:translateY(0); }
        @media (prefers-reduced-motion:reduce) { [data-lp]{ opacity:1;transform:none;transition:none; } }

        .lp-btn-primary {
          background: linear-gradient(135deg,#2563eb 0%,#60a5fa 100%);
          color:#fff; border:none; padding:15px 36px; border-radius:10px;
          font-size:15px; font-weight:700; cursor:pointer;
          font-family:'Space Grotesk',sans-serif; letter-spacing:-0.01em;
          box-shadow:0 4px 18px rgba(37,99,235,0.25);
          transition:box-shadow 0.25s,transform 0.2s;
          display:inline-flex; align-items:center; gap:8px;
        }
        .lp-btn-primary:hover { box-shadow:0 8px 30px rgba(37,99,235,0.38); transform:translateY(-2px); }

        .lp-btn-outline {
          background:rgba(255,255,255,0.80);
          color:#1e40af; border:1.5px solid rgba(37,99,235,0.18);
          padding:14px 26px; border-radius:10px;
          font-size:15px; font-weight:600; cursor:pointer;
          font-family:'Space Grotesk',sans-serif; text-decoration:none;
          backdrop-filter:blur(12px);
          transition:border-color 0.2s,box-shadow 0.2s,background 0.2s;
          display:inline-flex; align-items:center; gap:6px;
        }
        .lp-btn-outline:hover {
          border-color:rgba(37,99,235,0.40);
          box-shadow:0 4px 18px rgba(37,99,235,0.10);
          background:rgba(239,246,255,0.90);
        }

        .lp-feat-row {
          display:grid; grid-template-columns:72px 1fr; gap:0 36px;
          align-items:start; padding:38px 0;
          border-top:1px solid rgba(147,197,253,0.20);
          transition:border-color 0.3s;
        }
        .lp-feat-row:hover { border-top-color:rgba(37,99,235,0.20); }

        .lp-glow-card-base {
          border-radius:20px;
          transition: transform 0.30s cubic-bezier(0.16,1,0.3,1),
                      box-shadow  0.30s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-glow-card-base:hover {
          transform:translateY(-5px);
          box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.95),
                      0 32px 64px rgba(37,99,235,0.18),
                      0 0 0 2px rgba(59,130,246,0.40),
                      0 4px 12px rgba(0,0,0,0.06) !important;
        }

        .lp-grad { background:linear-gradient(135deg,#2563eb 0%,#60a5fa 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        @keyframes lp-logo-float {
          0%,100% { transform: translateY(0px)   rotate(-4deg) scale(1.00); }
          33%      { transform: translateY(-18px) rotate( 2deg) scale(1.03); }
          66%      { transform: translateY( 10px) rotate(-2deg) scale(0.97); }
        }
        @keyframes lp-logo-shimmer {
          0%,100% { opacity: 0.22; }
          50%      { opacity: 0.38; }
        }
        @media(max-width:700px){
          .lp-feat-row{grid-template-columns:1fr;gap:6px;}
          .lp-steps-grid{grid-template-columns:1fr!important;}
          .lp-price-grid{grid-template-columns:1fr!important;}
          .lp-prob-grid{grid-template-columns:1fr!important;}
          .lp-hero-h1{font-size:32px!important;}
        }
      `}</style>

      <div style={{ background: 'linear-gradient(180deg,#f0f6ff 0%,#ffffff 30%,#f8fbff 100%)', color: '#0f172a', minHeight: '100vh', fontFamily: FB, overflowX: 'hidden' }}>

        {/* ── NAV ── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, padding: '0 16px' }}>
          <GlowCard
            className="lp-glow-card-base"
            glowColor="rgba(96,165,250,0.15)"
            style={{ ...glass, maxWidth: '1100px', margin: '14px auto', padding: '12px 22px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              <img src="/logo.png" alt="EventOps" style={{ height: '44px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.18))' }} />
              <span style={{ fontFamily: FD, fontWeight: 700, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.03em' }}>EventOps</span>
            </div>
            <button className="lp-btn-primary" onClick={go} style={{ padding: '9px 20px', fontSize: '13px', borderRadius: '8px' }}>
              Launch App →
            </button>
          </GlowCard>
        </div>

        {/* ── HERO ── */}
        <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '110px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <FloatingStrings id="hero" color="rgba(59,130,246,0.10)" />

          {/* ── Background watermark logo ── */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -52%)',
            width: 'min(560px, 85vw)',
            height: 'min(560px, 85vw)',
            pointerEvents: 'none',
            zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: [
                  'brightness(0.6)',
                  'saturate(4)',
                  'hue-rotate(200deg)',
                  'drop-shadow(0 0 60px rgba(37,99,235,0.45))',
                  'drop-shadow(0 0 20px rgba(96,165,250,0.30))',
                ].join(' '),
                animation: 'lp-logo-float 9s ease-in-out infinite, lp-logo-shimmer 5s ease-in-out infinite',
              }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 5 }}>

            <h1 className="lp-hero-h1" style={{
              fontFamily: FD, fontSize: 'clamp(36px,6vw,70px)', fontWeight: 700,
              lineHeight: 1.05, letterSpacing: '-0.04em', color: '#0a0f1e',
              marginBottom: '24px', animation: 'heroIn 0.7s 0.1s ease-out both'
            }}>
              The command center for<br />
              <span className="lp-grad">college fests & symposiums</span>
            </h1>

            <p style={{ fontSize: '17px', color: '#4a5568', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 48px', fontFamily: FB, animation: 'heroIn 0.7s 0.25s ease-out both' }}>
              One scoped workspace per event. Delegate tasks, coordinate domains, track timelines, and watch analytics—all in real time.
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', animation: 'heroIn 0.7s 0.4s ease-out both' }}>
              <button className="lp-btn-primary" onClick={go}>
                Enter EventOps
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <a className="lp-btn-outline" href="#features">See how it works</a>
            </div>
          </div>
        </section>

        <StringDivider id="d1" />

        {/* ── PROBLEM → SOLUTION ── */}
        <section style={{ maxWidth: '880px', margin: '0 auto', padding: '80px 24px' }}>
          <div data-lp className="lp-prob-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', alignItems: 'stretch' }}>
            <GlowCard className="lp-glow-card-base" glowColor="rgba(148,163,184,0.20)" style={{ ...glass, padding: '40px 34px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '22px', fontFamily: FD }}>The old way</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Announcements buried in group chats', 'Tasks assigned verbally, never tracked', 'No one knows what\'s done or overdue'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '13px', marginTop: '3px', flexShrink: 0 }}>—</span>
                    <span style={{ fontSize: '14px', color: '#718096', lineHeight: 1.55, fontFamily: FB }}>{t}</span>
                  </div>
                ))}
              </div>
            </GlowCard>

            <GlowCard className="lp-glow-card-base" glowColor="rgba(59,130,246,0.18)" style={{ ...glassAccent, padding: '40px 34px' }}>
              <div className="lp-grad" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '22px', fontFamily: FD, display: 'block' }}>The EventOps way</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['One scoped workspace per event or subevent', 'Every task assigned, dated, and visible to all', 'Dashboards update the moment status changes'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span className="lp-grad" style={{ fontSize: '13px', marginTop: '3px', flexShrink: 0, fontWeight: 700 }}>✦</span>
                    <span style={{ fontSize: '14px', color: '#1e3a5f', lineHeight: 1.55, fontFamily: FB }}>{t}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          </div>
        </section>

        <StringDivider id="d2" />

        {/* ── FEATURES ── */}
        <section id="features" style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px', position: 'relative' }}>
          <FloatingStrings id="feat" color="rgba(59,130,246,0.05)" />
          <div style={{ position: 'relative', zIndex: 2 }}>

            <div data-lp style={{ marginBottom: '60px', textAlign: 'center' }}>
              <span className="lp-grad" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: FD, display: 'block' }}>Platform Capabilities</span>
              <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: 'clamp(24px,4vw,42px)', letterSpacing: '-0.03em', color: '#0a0f1e', lineHeight: 1.1 }}>
                Built for how college fests actually work
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
              {[
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>,
                  color: '#2563eb', bg: 'rgba(37,99,235,0.08)',
                  title: 'Multi-Level Event Scoping',
                  copy: 'Choose a master event; every view — tasks, chat, files, analytics — scopes itself automatically to show only what belongs.'
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  color: '#0891b2', bg: 'rgba(8,145,178,0.08)',
                  title: 'Role-Based Task Delegation',
                  copy: 'Assign tasks to specific coordinators, set hard deadlines, and receive instant overdue alerts before timelines slip.'
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>,
                  color: '#7c3aed', bg: 'rgba(124,58,237,0.08)',
                  title: 'Real-Time Chat + NLP',
                  copy: 'Chat rooms per subevent with a natural-language parser that turns action messages into tracked tasks automatically.'
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>,
                  color: '#059669', bg: 'rgba(5,150,105,0.08)',
                  title: 'Gantt & Calendar Timelines',
                  copy: 'Track all subevent progress on drag-to-resize Gantt bars and a color-coded monthly calendar grid.'
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
                  color: '#dc2626', bg: 'rgba(220,38,38,0.08)',
                  title: 'Secure Document Hub',
                  copy: 'Upload brochures, budgets, and guides with role-scoped access control down to the individual user level.'
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><path d="M2 20h20"/></svg>,
                  color: '#d97706', bg: 'rgba(217,119,6,0.08)',
                  title: 'Live Analytics Dashboards',
                  copy: 'Completion rates, member activity, and timeline trends—always in sync with the ground state in real time.'
                },
              ].map((f, i) => (
                <GlowCard
                  key={f.title}
                  glowColor={f.bg.replace('0.08', '0.22')}
                  className="lp-glow-card-base"
                  style={{ ...glass, padding: '36px 30px', display: 'flex', flexDirection: 'column', gap: '0', transitionDelay: `${i * 60}ms` }}
                >
                  <div data-lp style={{ transitionDelay: `${i * 60}ms` }}>
                    {/* Icon badge */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: f.bg,
                      border: `1px solid ${f.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', color: f.color,
                      marginBottom: '22px',
                      boxShadow: `0 4px 14px ${f.color}18`
                    }}>
                      {f.icon}
                    </div>
                    {/* Gradient number */}
                    <div className="lp-grad" style={{ fontFamily: FD, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px', display: 'block' }}>
                      0{i + 1}
                    </div>
                    <h3 style={{ fontFamily: FD, fontSize: '17px', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.25 }}>{f.title}</h3>
                    <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.65, margin: 0, fontFamily: FB }}>{f.copy}</p>
                  </div>
                </GlowCard>
              ))}
            </div>

          </div>
        </section>

        <StringDivider id="d3" />

        {/* ── HOW IT WORKS ── */}
        <section ref={howRef} style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 24px' }}>
          <div data-lp style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="lp-grad" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: FD, display: 'block' }}>Getting started</span>
            <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: 'clamp(24px,4vw,42px)', letterSpacing: '-0.03em', color: '#0a0f1e', lineHeight: 1.1 }}>Zero setup complexity</h2>
          </div>

          {/* Scroll-draw string connector */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <svg viewBox="0 0 800 50" fill="none" style={{ width: '100%', maxWidth: '680px', height: '48px' }} aria-hidden="true">
              <defs>
                <linearGradient id="conn-sg2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="rgba(37,99,235,0)" />
                  <stop offset="20%"  stopColor="rgba(37,99,235,0.28)" />
                  <stop offset="80%"  stopColor="rgba(96,165,250,0.25)" />
                  <stop offset="100%" stopColor="rgba(37,99,235,0)" />
                </linearGradient>
              </defs>
              <path d="M0 25 C80 10 200 42 350 20 C480 2 600 44 800 25"
                stroke="url(#conn-sg2)" strokeWidth="1.5" strokeLinecap="round"
                strokeDasharray="1200"
                strokeDashoffset={1200 * (1 - Math.min(1, connProgress))}
                style={{ transition: 'stroke-dashoffset 0.7s ease-out' }} />
            </svg>
          </div>

          <div className="lp-steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', marginTop: '8px' }}>
            {steps.map((s, i) => (
              <GlowCard
                key={s.n}
                data-lp-reveal={true}
                glowColor="rgba(59,130,246,0.15)"
                className="lp-glow-card-base"
                style={{ ...glass, padding: '36px 28px', transitionDelay: `${i * 100}ms` }}
              >
                <div data-lp style={{ transitionDelay: `${i * 100}ms` }}>
                  <span className="lp-grad" style={{ fontFamily: FD, fontSize: '42px', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, display: 'block', marginBottom: '16px' }}>{s.n}</span>
                  <h3 style={{ fontFamily: FD, fontSize: '16px', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em', marginBottom: '10px' }}>{s.title}</h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.65, margin: 0, fontFamily: FB }}>{s.body}</p>
                </div>
              </GlowCard>
            ))}
          </div>
        </section>

        <StringDivider id="d4" />

        {/* ── PRICING ── */}
        <section style={{ maxWidth: '1060px', margin: '0 auto', padding: '80px 24px' }}>
          <div data-lp style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="lp-grad" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: FD, display: 'block' }}>Pricing</span>
            <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: 'clamp(24px,4vw,42px)', letterSpacing: '-0.03em', color: '#0a0f1e', lineHeight: 1.1 }}>Simple, fair tiers</h2>
          </div>

          <div className="lp-price-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px', alignItems: 'stretch' }}>

            {/* Community */}
            <GlowCard data-lp className="lp-glow-card-base" glowColor="rgba(148,163,184,0.22)" style={{ ...glass, padding: '44px 34px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: FD, fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '22px' }}>Community</div>
              <div style={{ fontFamily: FD, fontSize: '42px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px' }}>₹0</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: FB, marginBottom: '34px' }}>Forever free for one department</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
                {['1 active Overall Event', 'Task lists & assignments', 'Scoped chat rooms', 'Monthly calendar view', '500 MB file storage'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#64748b', fontFamily: FB }}>
                    <span className="lp-grad" style={{ fontWeight: 700, flexShrink: 0 }}>—</span>{f}
                  </li>
                ))}
              </ul>
              <button className="lp-btn-outline" onClick={go} style={{ width: '100%', justifyContent: 'center' }}>Start free</button>
            </GlowCard>

            {/* Fest – accent, most popular */}
            <GlowCard data-lp className="lp-glow-card-base" glowColor="rgba(59,130,246,0.20)" style={{ ...glassAccent, padding: '44px 34px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '18px', right: '18px',
                background: 'linear-gradient(135deg,#2563eb,#60a5fa)',
                color: '#fff', fontSize: '9px', fontWeight: 800,
                padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.08em',
                fontFamily: FD, boxShadow: '0 2px 12px rgba(37,99,235,0.35)'
              }}>POPULAR</div>
              <div className="lp-grad" style={{ fontFamily: FD, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '22px' }}>Fest</div>
              <div style={{ fontFamily: FD, fontSize: '42px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px' }}>
                ₹499<span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 400 }}> /event</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7fa3', fontFamily: FB, marginBottom: '34px' }}>Best for campus-wide fests & symposiums</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
                {['Unlimited subevent nodes', 'Full Gantt timeline view', 'NLP task detection in chat', 'Real-time analytics dashboards', '10 GB secure file storage', 'Priority support'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#1e3a5f', fontFamily: FB }}>
                    <span className="lp-grad" style={{ fontWeight: 700, flexShrink: 0 }}>✦</span>{f}
                  </li>
                ))}
              </ul>
              <button className="lp-btn-primary" onClick={go} style={{ width: '100%', justifyContent: 'center' }}>Get started</button>
            </GlowCard>

            {/* Institution */}
            <GlowCard data-lp className="lp-glow-card-base" glowColor="rgba(148,163,184,0.22)" style={{ ...glass, padding: '44px 34px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: FD, fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '22px' }}>Institution</div>
              <div style={{ fontFamily: FD, fontSize: '42px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px' }}>Custom</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: FB, marginBottom: '34px' }}>For colleges running fests year-round</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
                {['All Fest features', 'Unlimited events & domains', 'Single Sign-On (SSO)', 'Custom domain setup', 'Dedicated account manager'].map(f => (
                  <li key={f} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#64748b', fontFamily: FB }}>
                    <span className="lp-grad" style={{ fontWeight: 700, flexShrink: 0 }}>—</span>{f}
                  </li>
                ))}
              </ul>
              <a className="lp-btn-outline" href="mailto:support@eventops.live?subject=Enterprise" style={{ width: '100%', justifyContent: 'center' }}>Contact sales</a>
            </GlowCard>

          </div>
        </section>

        {/* ── TECH STRIP ── */}
        <div style={{ textAlign: 'center', padding: '18px', fontSize: '11px', color: '#c1cad8', fontFamily: FB, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Node.js · MongoDB · React 18 · Socket.io · JWT Auth
        </div>

        {/* ── FINAL CTA ── */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 24px', borderTop: '1px solid rgba(147,197,253,0.15)' }}>
          <FloatingStrings id="cta" color="rgba(59,130,246,0.08)" />
          <GlowCard
            data-lp
            glowColor="rgba(59,130,246,0.18)"
            className="lp-glow-card-base"
            style={{ ...glassAccent, maxWidth: '660px', margin: '0 auto', padding: '72px 52px', textAlign: 'center', position: 'relative', zIndex: 5 }}
          >
            <h2 style={{ fontFamily: FD, fontWeight: 700, fontSize: 'clamp(24px,4vw,44px)', letterSpacing: '-0.03em', color: '#0a0f1e', lineHeight: 1.1, marginBottom: '18px' }}>
              Ready to coordinate your next <span className="lp-grad">major fest?</span>
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', fontFamily: FB, lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 36px' }}>
              Launch your EventOps workspace and start coordinating in minutes.
            </p>
            <button className="lp-btn-primary" onClick={go} style={{ fontSize: '15px', padding: '16px 40px' }}>
              Enter EventOps
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </GlowCard>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(147,197,253,0.12)', background: '#f0f6ff' }}>
          <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '36px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="EventOps" style={{ height: '22px', width: 'auto' }} />
              <span style={{ fontFamily: FD, fontWeight: 700, fontSize: '14px', color: '#7092c4' }}>EventOps</span>
              <span style={{ fontSize: '12px', color: '#b0c4de', fontFamily: FB }}>— Internal coordination engine</span>
            </div>
            <div style={{ display: 'flex', gap: '26px', fontSize: '12px', color: '#94a3b8', fontFamily: FB }}>
              {[['Features', '#features'], ['Log in', '/login'], ['Contact', 'mailto:support@eventops.live']].map(([label, href]) => (
                <a key={label} href={href} style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#2563eb'}
                  onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >{label}</a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

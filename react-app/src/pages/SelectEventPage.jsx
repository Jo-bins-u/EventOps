import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useEventContextStore } from '../store/eventContextStore';
import { AddRegular, DismissRegular, SignOutRegular, DeleteRegular, CalendarRegular } from '@fluentui/react-icons';
import LoadingScreen from '../components/LoadingScreen';

export default function SelectEventPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, logout } = useAuthStore();
  const { selectEvent } = useEventContextStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', venue: '', domain: '', eventHead: '' });

  // Fetch overall events (isSubEvent=false)
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['overallEvents'],
    queryFn: () => api.get('/events?isSubEvent=false').then(r => r.data),
  });

  const { data: domains = [] } = useQuery({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(r => r.data),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
    enabled: user?.role === 'admin',
  });

  const createEvent = useMutation({
    mutationFn: (data) => api.post('/events', { ...data, parentEvent: null }),
    onSuccess: () => {
      qc.invalidateQueries(['overallEvents']);
      setShowModal(false);
      setForm({ name: '', description: '', startDate: '', endDate: '', venue: '', domain: '', eventHead: '' });
      toast.success('Overall event created!');
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (eventId) => api.delete(`/events/${eventId}`),
    onSuccess: () => {
      qc.invalidateQueries(['overallEvents']);
      toast.success('Event deleted');
    },
  });

  const handleSelect = (ev) => {
    selectEvent({ id: ev._id, name: ev.name });
    navigate('/');
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) return <LoadingScreen message="Loading events..." />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '40px 20px' }}>
      {/* Top Header */}
      <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="EventOps Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>EventOps Platform</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Internal Coordination System</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{user?.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={handleSignOut} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 12px' }} title="Sign Out">
            <SignOutRegular style={{ width: '16px', height: '16px' }} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', color: 'var(--text)' }}>Select Overall Event</h1>
          <p style={{ fontSize: '14px', color: 'var(--text3)' }}>Choose a primary event context to enter the EventOps Platform</p>
        </div>

        {events.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
            <CalendarRegular style={{ width: '64px', height: '64px', margin: '0 auto 16px auto', color: 'var(--text3)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No active events found</h3>
            <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '24px' }}>
              {user?.role === 'admin' ? 'Create the first overall event to launch the platform.' : 'Please contact an administrator to register an event.'}
            </p>
            {user?.role === 'admin' && (
              <button className="btn btn-primary" style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowModal(true)}>
                <AddRegular style={{ width: '16px', height: '16px' }} /> Create Overall Event
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
              {user?.role === 'admin' && (
                <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowModal(true)}>
                  <AddRegular style={{ width: '16px', height: '16px' }} /> Create Overall Event
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {events.map((ev) => (
                <div
                  key={ev._id}
                  className="card"
                  onClick={() => handleSelect(ev)}
                  style={{
                    padding: '24px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'var(--transition-all)',
                    border: '0.5px solid var(--border)',
                    background: 'var(--surface)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                    e.currentTarget.style.borderColor = 'var(--blue)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {user?.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this overall event and all its tasks/subevents?')) {
                          deleteEvent.mutate(ev._id);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text3)',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'var(--transition-all)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
                      title="Delete event"
                    >
                      <DeleteRegular style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}

                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blue)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {ev.domain?.name || 'General'}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)', paddingRight: '24px' }}>
                    {ev.name}
                  </h3>
                  {ev.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '16px', lineHeight: 1.5 }}>
                      {ev.description.length > 90 ? ev.description.slice(0, 90) + '…' : ev.description}
                    </p>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>📍 {ev.venue || 'Various venues'}</div>
                    <div>
                      📅 {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : 'TBD'}
                      {ev.endDate && ev.endDate !== ev.startDate && ` - ${new Date(ev.endDate).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="modal-bg open">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DismissRegular style={{ width: '18px', height: '18px' }} />
            </button>
            <div className="modal-title">Create Overall Event</div>

            <div className="field">
              <label className="label">Event Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Annual Symposium 2026…" />
            </div>

            <div className="field">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Provide details about the main event…" />
            </div>

            <div className="g2" style={{ marginBottom: '14px' }}>
              <div>
                <label className="label">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>

            <div className="field">
              <label className="label">Venue</label>
              <input value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} placeholder="e.g. Main Auditorium…" />
            </div>

            <div className="g2" style={{ marginBottom: '14px' }}>
              <div>
                <label className="label">Domain *</label>
                <select value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}>
                  <option value="">Select Domain...</option>
                  {domains.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Event Head</label>
                <select value={form.eventHead} onChange={(e) => setForm((f) => ({ ...f, eventHead: e.target.value }))}>
                  <option value="">Select Head...</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '9px', marginTop: '16px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={!form.name || !form.domain || createEvent.isPending}
                onClick={() => createEvent.mutate(form)}
              >
                {createEvent.isPending ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useEventContextStore } from '../store/eventContextStore';
import {
  AddRegular,
  CalendarRegular,
  ChatRegular,
  DismissRegular
} from '@fluentui/react-icons';

export default function EventsPage() {
  const { selectedEvent } = useEventContextStore();
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', venue: '', domain: '', eventHead: '' });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', selectedEvent?.id, statusFilter, domainFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (domainFilter) params.set('domain', domainFilter);
      if (selectedEvent?.id) params.set('parentEvent', selectedEvent.id);
      return api.get(`/events?${params}`).then(r => r.data);
    },
  });

  const { data: domains = [] } = useQuery({ queryKey: ['domains'], queryFn: () => api.get('/domains').then(r => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data), enabled: hasPermission('CREATE_EVENT') });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/events', { ...data, parentEvent: selectedEvent?.id }),
    onSuccess: () => {
      qc.invalidateQueries(['events']);
      setShowModal(false);
      setForm({ name: '', description: '', startDate: '', endDate: '', venue: '', domain: '', eventHead: '' });
      toast.success('Subevent created!');
    },
  });

  const statusColor = { active: 'tag-blue', planning: 'tag-green', completed: 'tag-teal', draft: 'tag-purple', cancelled: 'tag-red', setup: 'tag-amber' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Events</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
          <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">All domains</option>
            {domains.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          {hasPermission('CREATE_EVENT') && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <AddRegular style={{ width: '14px', height: '14px' }} /> New Event
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>Loading events…</div>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CalendarRegular style={{ width: '48px', height: '48px', marginBottom: '12px', color: 'var(--text3)' }} />
          <div style={{ fontWeight: 500, marginBottom: '6px' }}>No events found</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {hasPermission('CREATE_EVENT') ? 'Create your first event to get started.' : 'You have not been added to any events yet.'}
          </div>
        </div>
      ) : (
        <div className="g2">
          {events.map(ev => (
            <div key={ev._id} className="card" style={{ transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>{ev.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {ev.domain?.name}
                    {ev.startDate && ` · ${new Date(ev.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`}
                    {ev.endDate && ev.endDate !== ev.startDate && ` – ${new Date(ev.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`}
                  </div>
                </div>
                <span className={`tag ${statusColor[ev.status] || 'tag-blue'}`} style={{ textTransform: 'capitalize', flexShrink: 0 }}>{ev.status}</span>
              </div>
              {ev.description && (
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px', lineHeight: 1.5 }}>
                  {ev.description.length > 100 ? ev.description.slice(0, 100) + '…' : ev.description}
                </div>
              )}
              <div className="pbar" style={{ marginBottom: '7px' }}>
                <div className="pfill" style={{ width: `${ev.completionRate || 0}%`, background: ev.domain?.color || 'var(--blue)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '12px' }}>
                <span>{ev.completionRate || 0}% complete</span>
                <span>{ev.taskCount || 0} tasks · {ev.members?.length || 0} members</span>
              </div>
              <div style={{ display: 'flex', gap: '7px' }}>
                <Link to={`/events/${ev._id}`} className="btn btn-sm">View details</Link>
                <Link to="/chat" className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ChatRegular style={{ width: '14px', height: '14px' }} /> Chat
                </Link>
                {hasPermission('ASSIGN_TASK') && (
                  <button className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AddRegular style={{ width: '12px', height: '12px' }} /> Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showModal && (
        <div className="modal-bg open">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DismissRegular style={{ width: '18px', height: '18px' }} />
            </button>
            <div className="modal-title">Create New Event</div>
            <div className="field"><label className="label">Event name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tech Symposium 2025" />
            </div>
            <div className="field"><label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this event about?" />
            </div>
            <div className="g2" style={{ marginBottom: '14px' }}>
              <div><label className="label">Start date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div><label className="label">End date</label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="field"><label className="label">Domain *</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}>
                <option value="">Select domain…</option>
                {domains.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field"><label className="label">Event Head</label>
              <select value={form.eventHead} onChange={e => setForm(f => ({ ...f, eventHead: e.target.value }))}>
                <option value="">Select event head…</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role?.replace('_', ' ')})</option>)}
              </select>
            </div>
            <div className="field"><label className="label">Venue</label>
              <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="e.g. Auditorium A, Innovation Lab" />
            </div>
            <div style={{ display: 'flex', gap: '9px', marginTop: '6px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={!form.name || !form.domain || createMutation.isPending}
                onClick={() => createMutation.mutate(form)}>
                {createMutation.isPending ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

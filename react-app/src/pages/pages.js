// ─── UsersPage ──────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export function UsersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data) });
  const updatePerms = useMutation({
    mutationFn: ({ id, role, permissions }) => api.patch(`/users/${id}/permissions`, { role, permissions }),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('Permissions updated'); setEditing(null); },
  });
  const ROLES = ['admin', 'domain_head', 'event_head', 'student_rep', 'volunteer'];
  const ALL_PERMS = ['CREATE_EVENT', 'ASSIGN_TASK', 'VIEW_ANALYTICS', 'MANAGE_USERS', 'UPLOAD_DOCS', 'BROADCAST', 'DELETE_CONTENT', 'MANAGE_DOMAIN'];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Users & Roles</div>
        <button className="btn btn-primary">+ Invite User</button>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>User</th><th>Role</th><th>Domain</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="av av-blue" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{u.name?.slice(0, 2).toUpperCase()}</div>
                    <div><div style={{ fontWeight: 500, fontSize: '12px' }}>{u.name}</div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>{u.email}</div></div>
                  </div>
                </td>
                <td><span className="tag tag-blue" style={{ textTransform: 'capitalize', fontSize: '11px' }}>{u.role?.replace('_', ' ')}</span></td>
                <td style={{ fontSize: '12px' }}>{u.domain?.name || '—'}</td>
                <td><span className={`tag ${u.status === 'active' ? 'tag-green' : 'tag-red'}`}>{u.status}</span></td>
                <td><button className="btn btn-sm" onClick={() => setEditing(u)}>Edit Perms</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-close" onClick={() => setEditing(null)}>×</div>
            <div className="modal-title">Edit: {editing.name}</div>
            <div className="field"><label className="label">Role</label>
              <select defaultValue={editing.role} id="edit-role" style={{ marginBottom: '10px' }}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="label" style={{ marginBottom: '8px' }}>Permission overrides</div>
            {ALL_PERMS.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: '13px' }}>
                <input type="checkbox" id={`perm-${p}`} defaultChecked={editing.permissions?.includes(p)} style={{ accentColor: 'var(--blue)' }} />
                <label htmlFor={`perm-${p}`} style={{ cursor: 'pointer' }}>{p}</label>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '9px', marginTop: '14px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  const role = document.getElementById('edit-role').value;
                  const permissions = ALL_PERMS.filter(p => document.getElementById(`perm-${p}`)?.checked);
                  updatePerms.mutate({ id: editing._id, role, permissions });
                }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProfilePage ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', department: user?.department || '' });
  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' });
  const saveMutation = useMutation({
    mutationFn: (data) => api.patch(`/users/${user._id}`, data),
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile updated!'); },
  });
  const pwMutation = useMutation({
    mutationFn: (data) => api.post('/auth/change-password', data),
    onSuccess: () => { toast.success('Password updated!'); setPwForm({ current: '', newPass: '', confirm: '' }); },
  });
  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '18px' }}>Profile & Security</div>
      <div className="g2">
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '16px', borderBottom: '0.5px solid var(--border)', marginBottom: '16px' }}>
            <div className="av av-blue" style={{ width: '64px', height: '64px', fontSize: '22px', marginBottom: '10px' }}>{user?.name?.slice(0, 2).toUpperCase()}</div>
            <div style={{ fontSize: '15px', fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{user?.email}</div>
            <span className="tag tag-blue" style={{ marginTop: '8px', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="field"><label className="label">Display name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="field"><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="field"><label className="label">Department</label><input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
        <div>
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="card-title">Change Password</div>
            <div className="field"><label className="label">Current password</label><input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" /></div>
            <div className="field"><label className="label">New password</label><input type="password" value={pwForm.newPass} onChange={e => setPwForm(f => ({ ...f, newPass: e.target.value }))} placeholder="••••••••" /></div>
            <div className="field"><label className="label">Confirm new password</label><input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" /></div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              disabled={!pwForm.current || !pwForm.newPass || pwForm.newPass !== pwForm.confirm}
              onClick={() => pwMutation.mutate({ currentPassword: pwForm.current, newPassword: pwForm.newPass })}>
              Update Password
            </button>
          </div>
          <div className="card">
            <div className="card-title">Notification Preferences</div>
            {[['taskAssigned', 'Task assigned to me'], ['deadlineReminder', 'Deadline reminders'], ['chatMentions', 'Chat mentions'], ['emailDigest', 'Daily email digest'], ['emailOverdue', 'Overdue email alerts']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: '13px' }}>{label}</span>
                <div className={`toggle ${user?.notifPrefs?.[key] !== false ? 'on' : ''}`} onClick={() => {
                  const prefs = { ...user?.notifPrefs, [key]: !(user?.notifPrefs?.[key] !== false) };
                  api.patch(`/users/${user._id}/notif-prefs`, prefs).then(() => updateUser({ notifPrefs: prefs }));
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EventsPage ──────────────────────────────────────────────────────────────
export function EventsPage() {
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) });
  const { hasPermission } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', venue: '', domain: '' });
  const { data: domains = [] } = useQuery({ queryKey: ['domains'], queryFn: () => api.get('/domains').then(r => r.data) });
  const qc = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/events', data),
    onSuccess: () => { qc.invalidateQueries(['events']); setShowModal(false); toast.success('Event created!'); },
  });
  const statusColor = { active: 'tag-blue', planning: 'tag-green', completed: 'tag-teal', draft: 'tag-purple', cancelled: 'tag-red' };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Events</div>
        {hasPermission('CREATE_EVENT') && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Event</button>}
      </div>
      <div className="g2">
        {events.map(ev => (
          <div key={ev._id} className="card" style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div><div style={{ fontSize: '14px', fontWeight: 500 }}>{ev.name}</div><div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{ev.domain?.name} · {ev.startDate ? new Date(ev.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'TBD'}</div></div>
              <span className={`tag ${statusColor[ev.status] || 'tag-blue'}`} style={{ textTransform: 'capitalize' }}>{ev.status}</span>
            </div>
            {ev.description && <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px' }}>{ev.description.slice(0, 100)}{ev.description.length > 100 ? '…' : ''}</div>}
            <div className="pbar" style={{ marginBottom: '7px' }}><div className="pfill" style={{ width: `${ev.completionRate || 0}%`, background: ev.domain?.color || 'var(--blue)' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}><span>{ev.completionRate || 0}% complete</span><span>{ev.taskCount || 0} tasks · {ev.members?.length || 0} members</span></div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <a href={`/events/${ev._id}`} className="btn btn-sm">View</a>
              <a href="/chat" className="btn btn-sm">Chat</a>
              {hasPermission('ASSIGN_TASK') && <button className="btn btn-sm btn-primary">+ Task</button>}
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-close" onClick={() => setShowModal(false)}>×</div>
            <div className="modal-title">Create Event</div>
            <div className="field"><label className="label">Event name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Event name…" /></div>
            <div className="g2" style={{ marginBottom: '14px' }}>
              <div><label className="label">Start date</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div><label className="label">End date</label><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
            <div className="field"><label className="label">Domain *</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}>
                <option value="">Select domain…</option>
                {domains.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field"><label className="label">Venue</label><input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Location…" /></div>
            <div className="field"><label className="label">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!form.name || !form.domain || createMutation.isPending}
                onClick={() => createMutation.mutate(form)}>{createMutation.isPending ? 'Creating…' : 'Create Event'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EventDetailPage ──────────────────────────────────────────────────────────
export function EventDetailPage() {
  const { id } = { id: window.location.pathname.split('/').pop() };
  const [tab, setTab] = useState('overview');
  const { data: event } = useQuery({ queryKey: ['event', id], queryFn: () => api.get(`/events/${id}`).then(r => r.data), enabled: !!id });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', { event: id }], queryFn: () => api.get(`/tasks?event=${id}`).then(r => r.data), enabled: !!id });
  if (!event) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>Loading event…</div>;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const rate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  return (
    <div>
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '16px 18px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ fontSize: '18px', fontWeight: 500 }}>{event.name}</div>
              <span className="tag tag-blue" style={{ textTransform: 'capitalize' }}>{event.status}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{event.domain?.name} · {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'} · {event.venue || 'Venue TBD'}</div>
            {event.description && <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px' }}>{event.description}</div>}
          </div>
          <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
            <button className="btn btn-sm">Edit</button>
            <button className="btn btn-sm btn-primary">+ Task</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px' }}>
          <div style={{ flex: 1, maxWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}><span>{rate}% complete</span><span>{completed}/{tasks.length} tasks</span></div>
            <div className="pbar"><div className="pfill" style={{ width: `${rate}%`, background: 'var(--blue)' }} /></div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{event.members?.length || 0} members</div>
        </div>
      </div>
      <div className="inner-tabs">
        {['overview', 'tasks', 'team', 'files'].map(t => (
          <div key={t} className={`itab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</div>
        ))}
      </div>
      {tab === 'overview' && (
        <div className="g3">
          <div className="metric"><div className="metric-label">Tasks</div><div className="metric-value">{tasks.length}</div></div>
          <div className="metric"><div className="metric-label">Overdue</div><div className="metric-value" style={{ color: 'var(--red)' }}>{tasks.filter(t => t.status === 'overdue').length}</div></div>
          <div className="metric"><div className="metric-label">Members</div><div className="metric-value">{event.members?.length || 0}</div></div>
        </div>
      )}
      {tab === 'tasks' && (
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Task</th><th>Assigned</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t._id}>
                  <td style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>{t.title}</td>
                  <td style={{ fontSize: '12px' }}>{t.assignedTo?.name || '—'}</td>
                  <td style={{ fontSize: '12px', color: t.status === 'overdue' ? 'var(--red)' : 'var(--text3)' }}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}</td>
                  <td><span className={`tag ${t.status === 'completed' ? 'tag-green' : t.status === 'overdue' ? 'tag-red' : t.status === 'in_progress' ? 'tag-amber' : 'tag-blue'}`} style={{ textTransform: 'capitalize', fontSize: '11px' }}>{t.status?.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'team' && (
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Member</th><th>Role</th><th>Email</th></tr></thead>
            <tbody>
              {event.members?.map(m => (
                <tr key={m._id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div className="av av-blue" style={{ width: '26px', height: '26px', fontSize: '10px' }}>{m.name?.slice(0, 2).toUpperCase()}</div>{m.name}</div></td>
                  <td><span className="tag tag-teal" style={{ textTransform: 'capitalize', fontSize: '11px' }}>{m.role?.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text3)' }}>{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────
export function CalendarPage() {
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/tasks').then(r => r.data) });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) });
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const getEventsForDay = (d) => {
    const date = new Date(year, month, d);
    const taskItems = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === date.toDateString());
    const eventItems = events.filter(e => e.startDate && new Date(e.startDate).toDateString() === date.toDateString());
    return { tasks: taskItems, events: eventItems };
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>{monthNames[month]} {year}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" onClick={() => { const d = new Date(year, month - 1); setMonth(d.getMonth()); setYear(d.getFullYear()); }}>◀ Prev</button>
          <button className="btn btn-sm" onClick={() => { const d = new Date(year, month + 1); setMonth(d.getMonth()); setYear(d.getFullYear()); }}>Next ▶</button>
        </div>
      </div>
      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-hdr">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="cal-cell" style={{ background: 'var(--surface2)' }} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const { tasks: dt, events: de } = getEventsForDay(d);
          return (
            <div key={d} className="cal-cell">
              <div className={`cal-day${isToday ? ' today' : ''}`}>{d}</div>
              {de.slice(0, 1).map(e => <div key={e._id} className="cal-evt" style={{ background: 'var(--blue)', color: '#fff' }}>{e.name}</div>)}
              {dt.slice(0, 2).map(t => <div key={t._id} className="cal-evt" style={{ background: t.status === 'overdue' ? 'var(--red-bg)' : 'var(--amber-bg)', color: t.status === 'overdue' ? 'var(--red)' : 'var(--amber)' }}>{t.title}</div>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DomainsPage ─────────────────────────────────────────────────────────────
export function DomainsPage() {
  const { data: domains = [] } = useQuery({ queryKey: ['domains'], queryFn: () => api.get('/domains').then(r => r.data) });
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Domain Management</div>
        <button className="btn btn-primary">+ New Domain</button>
      </div>
      <div className="g2">
        {domains.map(d => (
          <div key={d._id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: d.color ? d.color + '22' : 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{d.icon || '◈'}</div>
              <div><div style={{ fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>Head: {d.head?.name || 'Unassigned'}</div></div>
              <span className={`tag ${d.status === 'active' ? 'tag-green' : 'tag-amber'}`} style={{ marginLeft: 'auto' }}>{d.status}</span>
            </div>
            {d.description && <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px' }}>{d.description}</div>}
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{d.members?.length || 0} members</span>
            </div>
            <div style={{ display: 'flex', gap: '7px', marginTop: '10px' }}>
              <button className="btn btn-sm">View Events</button>
              <button className="btn btn-sm">Manage Members</button>
              <button className="btn btn-sm btn-primary">Add Event</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NotFoundPage ─────────────────────────────────────────────────────────────
export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '64px' }}>404</div>
      <div style={{ fontSize: '18px', fontWeight: 500 }}>Page not found</div>
      <a href="/" className="btn btn-primary">Go to Dashboard</a>
    </div>
  );
}

// Re-exports for App.jsx named imports
export { useState } from 'react';
export { useQuery } from '@tanstack/react-query';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ALL_PERMS = [
  { key: 'CREATE_EVENT',   label: 'Create & edit events' },
  { key: 'ASSIGN_TASK',    label: 'Assign tasks to members' },
  { key: 'VIEW_ANALYTICS', label: 'View analytics & reports' },
  { key: 'MANAGE_USERS',   label: 'Invite & remove users' },
  { key: 'UPLOAD_DOCS',    label: 'Upload documents & files' },
  { key: 'BROADCAST',      label: 'Send admin announcements' },
  { key: 'DELETE_CONTENT', label: 'Delete messages, tasks, files' },
  { key: 'MANAGE_DOMAIN',  label: 'Manage domain members' },
];

const ROLES = ['admin', 'domain_head', 'event_head', 'student_rep', 'volunteer'];

export default function UsersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editPerms, setEditPerms] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'volunteer', collegeId: '' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      return api.get(`/users?${params}`).then(r => r.data);
    },
  });

  const updatePerms = useMutation({
    mutationFn: ({ id, role, permissions }) => api.patch(`/users/${id}/permissions`, { role, permissions }),
    onSuccess: () => { qc.invalidateQueries(['users']); setEditing(null); toast.success('Permissions updated!'); },
  });

  const suspendUser = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User suspended'); },
  });

  const inviteUser = useMutation({
    mutationFn: (data) => api.post('/auth/invite', data).then(r => r.data),
    onSuccess: (data) => { qc.invalidateQueries(['users']); setShowInvite(false); if (data.tempPassword) { toast.success('Invite created. Temp password: ' + data.tempPassword, { duration: 10000 }); } else { toast.success('Invitation email sent to ' + inviteForm.email); } },
  });

  const openEdit = (u) => {
    setEditing(u);
    setEditRole(u.role);
    setEditPerms(u.permissions || []);
  };

  const togglePerm = (perm) => setEditPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);

  const statusColor = { active: 'tag-green', suspended: 'tag-red', pending: 'tag-amber' };
  const roleColor = { admin: 'tag-blue', domain_head: 'tag-teal', event_head: 'tag-purple', student_rep: 'tag-amber', volunteer: '' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Users & Roles</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
            style={{ padding: '6px 11px', fontSize: '12px', width: '200px' }} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>+ Invite User</button>
        </div>
      </div>

      {/* Permission matrix reference card */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-title">Role Permissions Matrix</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Admin</th>
                <th>Domain Head</th>
                <th>Event Head</th>
                <th>Student Rep</th>
                <th>Volunteer</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CREATE_EVENT',   true,  true,  false, false, false],
                ['ASSIGN_TASK',    true,  true,  true,  false, false],
                ['VIEW_ANALYTICS', true,  true,  true,  false, false],
                ['MANAGE_USERS',   true,  false, false, false, false],
                ['UPLOAD_DOCS',    true,  true,  true,  true,  false],
                ['BROADCAST',      true,  false, false, false, false],
                ['MANAGE_DOMAIN',  true,  true,  false, false, false],
                ['DELETE_CONTENT', true,  false, false, false, false],
              ].map(([perm, ...vals]) => (
                <tr key={perm}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{perm}</td>
                  {vals.map((v, i) => (
                    <td key={i} style={{ textAlign: 'center', color: v ? 'var(--green)' : 'var(--text3)' }}>{v ? '✓' : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>Loading users…</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>User</th><th>Role</th><th>Domain</th><th>College ID</th><th>Status</th><th>Last active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div className="av av-blue" style={{ width: '30px', height: '30px', fontSize: '11px' }}>{u.name?.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '12px' }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${roleColor[u.role] || ''}`} style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px' }}>{u.domain?.name || '—'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'monospace' }}>{u.collegeId || '—'}</td>
                  <td><span className={`tag ${statusColor[u.status] || 'tag-blue'}`} style={{ fontSize: '10px' }}>{u.status}</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {u.lastActive ? new Date(u.lastActive).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'Never'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn btn-sm" onClick={() => openEdit(u)}>Edit Perms</button>
                      {u.status === 'active' && (
                        <button className="btn btn-sm btn-danger" onClick={() => { if (window.confirm(`Suspend ${u.name}?`)) suspendUser.mutate(u._id); }}>Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Permissions Modal */}
      {editing && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-close" onClick={() => setEditing(null)}>×</div>
            <div className="modal-title">Edit: {editing.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surface2)', borderRadius: '8px', marginBottom: '16px' }}>
              <div className="av av-blue" style={{ width: '36px', height: '36px', fontSize: '13px' }}>{editing.name?.slice(0, 2).toUpperCase()}</div>
              <div><div style={{ fontWeight: 500 }}>{editing.name}</div><div style={{ fontSize: '11px', color: 'var(--text3)' }}>{editing.email}</div></div>
            </div>
            <div className="field"><label className="label">Role</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div className="label" style={{ marginBottom: '8px' }}>Permission overrides <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(applied on top of role defaults)</span></div>
              {ALL_PERMS.map(p => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <input type="checkbox" checked={editPerms.includes(p.key)} style={{ accentColor: 'var(--blue)', width: '15px', height: '15px' }}
                    onChange={() => togglePerm(p.key)} id={`perm-${p.key}`} />
                  <label htmlFor={`perm-${p.key}`} style={{ cursor: 'pointer', flex: 1 }}>
                    <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>{p.key}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{p.label}</div>
                  </label>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--amber-bg)', borderRadius: '7px', fontSize: '12px', color: 'var(--amber)', marginBottom: '14px' }}>
              Changes take effect immediately after saving.
            </div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-sm" onClick={() => setEditPerms([])} style={{ whiteSpace: 'nowrap' }}>Reset</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={updatePerms.isPending}
                onClick={() => updatePerms.mutate({ id: editing._id, role: editRole, permissions: editPerms })}>
                {updatePerms.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInvite && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-close" onClick={() => setShowInvite(false)}>×</div>
            <div className="modal-title">Invite New User</div>
            <div className="field"><label className="label">Full name *</label>
              <input value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Riya Sharma" />
            </div>
            <div className="field"><label className="label">College email *</label>
              <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="riya@college.edu" />
            </div>
            <div className="field"><label className="label">College ID</label>
              <input value={inviteForm.collegeId} onChange={e => setInviteForm(f => ({ ...f, collegeId: e.target.value }))} placeholder="STU2025-XXX" />
            </div>
            <div className="field"><label className="label">Role</label>
              <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--blue-bg)', borderRadius: '7px', fontSize: '12px', color: 'var(--blue-t)', marginBottom: '14px' }}>
              An invitation email with a temporary password will be sent to the user. If email is not configured, the temp password will appear on screen.
            </div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowInvite(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={!inviteForm.name || !inviteForm.email || inviteUser.isPending}
                onClick={() => inviteUser.mutate(inviteForm)}>
                {inviteUser.isPending ? 'Inviting…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

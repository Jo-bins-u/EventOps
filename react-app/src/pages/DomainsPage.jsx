import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import LoadingScreen from '../components/LoadingScreen';

const DOMAIN_ICONS = ['⚙', '🎭', '🏅', '📚', '💰', '🎨', '🔬', '🎵', '♟', '🌐'];
const DOMAIN_COLORS = ['#185FA5', '#534AB7', '#0F6E56', '#854F0B', '#A32D2D', '#993556', '#2D7A6B', '#6B4A2D', '#4A6B2D', '#2D4A6B'];

export default function DomainsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: DOMAIN_COLORS[0], icon: DOMAIN_ICONS[0] });

  const { data: domains = [], isLoading } = useQuery({ queryKey: ['domains'], queryFn: () => api.get('/domains').then(r => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data) });

  const createDomain = useMutation({
    mutationFn: (data) => api.post('/domains', data),
    onSuccess: () => { qc.invalidateQueries(['domains']); setShowCreate(false); setForm({ name: '', description: '', color: DOMAIN_COLORS[0], icon: DOMAIN_ICONS[0] }); toast.success('Domain created!'); },
  });

  const addMember = useMutation({
    mutationFn: ({ domainId, userId }) => api.post(`/domains/${domainId}/members`, { userId }),
    onSuccess: () => { qc.invalidateQueries(['domains']); setShowAddMember(false); toast.success('Member added!'); },
  });

  const removeMember = useMutation({
    mutationFn: ({ domainId, userId }) => api.delete(`/domains/${domainId}/members/${userId}`),
    onSuccess: () => { qc.invalidateQueries(['domains']); toast.success('Member removed'); },
  });

  const selectedDomain = domains.find(d => d._id === selected);

  if (isLoading) return <LoadingScreen message="Loading domains..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Domain Management</div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Domain</button>
      </div>

      <div className="g2" style={{ marginBottom: '16px' }}>
        {domains.map(d => (
          <div key={d._id} className="card" style={{ cursor: 'pointer', outline: selected === d._id ? `2px solid ${d.color || 'var(--blue)'}` : 'none', transition: 'all 0.15s' }}
            onClick={() => setSelected(selected === d._id ? null : d._id)}
            onMouseEnter={e => { if (selected !== d._id) e.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={e => { if (selected !== d._id) e.currentTarget.style.background = ''; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: (d.color || '#185FA5') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                {d.icon || '◈'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{d.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>Head: {d.head?.name || 'Unassigned'}</div>
              </div>
              <span className={`tag ${d.status === 'active' ? 'tag-green' : 'tag-amber'}`}>{d.status}</span>
            </div>
            {d.description && <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px', lineHeight: 1.5 }}>{d.description}</div>}
            <div className="g3" style={{ marginBottom: '10px' }}>
              <div style={{ background: 'var(--surface2)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{d.members?.length || 0}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Members</div>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>—</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Events</div>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>—</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Tasks</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setSelected(d._id); }}>Members</button>
              <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); setSelected(d._id); setShowAddMember(true); }}>+ Add Member</button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected domain member table */}
      {selectedDomain && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{selectedDomain.name} — Members ({selectedDomain.members?.length || 0})</div>
            <button className="btn btn-sm btn-primary" onClick={() => setShowAddMember(true)}>+ Assign Member</button>
          </div>
          {!selectedDomain.members?.length ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No members assigned yet.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Member</th><th>Role</th><th>Email</th><th></th></tr></thead>
              <tbody>
                {selectedDomain.members.map(m => (
                  <tr key={m._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="av av-blue" style={{ width: '26px', height: '26px', fontSize: '10px' }}>{m.name?.slice(0, 2).toUpperCase()}</div>
                        <div style={{ fontWeight: 500, fontSize: '12px' }}>{m.name}</div>
                      </div>
                    </td>
                    <td><span className="tag tag-teal" style={{ fontSize: '10px', textTransform: 'capitalize' }}>{m.role?.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text3)' }}>{m.email}</td>
                    <td>
                      <button className="btn btn-sm btn-danger"
                        onClick={() => { if (window.confirm(`Remove ${m.name}?`)) removeMember.mutate({ domainId: selectedDomain._id, userId: m._id }); }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Domain Modal */}
      {showCreate && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-close" onClick={() => setShowCreate(false)}>×</div>
            <div className="modal-title">Create New Domain</div>
            <div className="field"><label className="label">Domain name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Finance, Arts, Media" />
            </div>
            <div className="field"><label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this domain cover?" />
            </div>
            <div className="field"><label className="label">Icon</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DOMAIN_ICONS.map(ic => (
                  <div key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer', background: form.icon === ic ? 'var(--blue-bg)' : 'var(--surface2)', outline: form.icon === ic ? '2px solid var(--blue)' : 'none' }}>
                    {ic}
                  </div>
                ))}
              </div>
            </div>
            <div className="field"><label className="label">Color</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DOMAIN_COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', background: c + '33', border: `2px solid ${form.color === c ? c : 'transparent'}`, cursor: 'pointer', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: '4px', borderRadius: '3px', background: c }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '9px', marginTop: '6px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={!form.name || createDomain.isPending}
                onClick={() => createDomain.mutate(form)}>
                {createDomain.isPending ? 'Creating…' : 'Create Domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && selectedDomain && (
        <div className="modal-bg open">
          <div className="modal">
            <div className="modal-close" onClick={() => setShowAddMember(false)}>×</div>
            <div className="modal-title">Add Member to {selectedDomain.name}</div>
            <div className="field"><label className="label">Select user</label>
              <select id="member-select" style={{ marginBottom: '14px' }}>
                <option value="">Choose a user…</option>
                {users.filter(u => !selectedDomain.members?.some(m => m._id === u._id)).map(u => (
                  <option key={u._id} value={u._id}>{u.name} — {u.role?.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddMember(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={addMember.isPending}
                onClick={() => {
                  const userId = document.getElementById('member-select').value;
                  if (!userId) return toast.error('Please select a user');
                  addMember.mutate({ domainId: selectedDomain._id, userId });
                }}>
                {addMember.isPending ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

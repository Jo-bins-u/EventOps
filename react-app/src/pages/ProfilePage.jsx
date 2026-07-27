import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', department: user?.department || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [prefs, setPrefs] = useState(user?.notifPrefs || {});

  const saveMutation = useMutation({
    mutationFn: (data) => api.patch(`/users/${user._id}`, data).then(r => r.data),
    onSuccess: (data) => { updateUser(data); toast.success('Profile updated!'); },
  });

  const pwMutation = useMutation({
    mutationFn: (data) => api.post('/auth/change-password', data),
    onSuccess: () => { toast.success('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Password change failed'),
  });

  const prefMutation = useMutation({
    mutationFn: (data) => api.patch(`/users/${user._id}/notif-prefs`, data).then(r => r.data),
    onSuccess: (data) => { updateUser({ notifPrefs: data }); toast.success('Preferences saved'); },
  });

  const togglePref = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    prefMutation.mutate(updated);
  };

  const PREF_ITEMS = [
    { key: 'taskAssigned',     label: 'Task assigned to me',        sub: 'Immediate notification' },
    { key: 'deadlineReminder', label: 'Deadline reminders',          sub: '24h and 1h before due date' },
    { key: 'chatMentions',     label: 'Chat @mentions',              sub: 'When someone mentions you' },
    { key: 'allMessages',      label: 'All new messages',            sub: 'Every message in your channels' },
    { key: 'emailDigest',      label: 'Daily email digest',          sub: 'Summary of activity at 8 AM' },
    { key: 'emailOverdue',     label: 'Overdue task email alerts',   sub: 'When tasks pass their deadline' },
  ];

  const roleColor = { admin: 'tag-blue', domain_head: 'tag-teal', event_head: 'tag-purple', student_rep: 'tag-amber', volunteer: '' };

  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '18px' }}>Profile & Security</div>
      <div className="g2">
        {/* Left column */}
        <div>
          <div className="card" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '16px', borderBottom: '0.5px solid var(--border)', marginBottom: '16px', textAlign: 'center' }}>
              <div className="av av-blue" style={{ width: '64px', height: '64px', fontSize: '22px', marginBottom: '12px' }}>
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>{user?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{user?.email}</div>
              {user?.collegeId && <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace', marginTop: '2px' }}>{user.collegeId}</div>}
              <span className={`tag ${roleColor[user?.role] || ''}`} style={{ marginTop: '10px', textTransform: 'capitalize' }}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <div className="field"><label className="label">Display name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field"><label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="field"><label className="label">Department</label>
              <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Computer Science" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
              {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
            </button>
          </div>

          <div className="card">
            <div className="card-title">Notification Preferences</div>
            {PREF_ITEMS.map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '13px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{item.sub}</div>
                </div>
                <div className={`toggle ${prefs[item.key] !== false ? 'on' : ''}`} onClick={() => togglePref(item.key)} />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0' }}>
              <div>
                <div style={{ fontSize: '13px' }}>Admin broadcasts</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Always on — cannot be disabled</div>
              </div>
              <div className="toggle on" style={{ opacity: 0.5, pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="card-title">Change Password</div>
            <div className="field"><label className="label">Current password</label>
              <input type="password" value={pwForm.currentPassword} placeholder="••••••••"
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div className="field"><label className="label">New password</label>
              <input type="password" value={pwForm.newPassword} placeholder="Min 6 characters"
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div className="field"><label className="label">Confirm new password</label>
              <input type="password" value={pwForm.confirm} placeholder="••••••••"
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>
            {pwForm.newPassword && pwForm.confirm && pwForm.newPassword !== pwForm.confirm && (
              <div style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '10px' }}>Passwords do not match.</div>
            )}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              disabled={!pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirm || pwMutation.isPending}
              onClick={() => pwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })}>
              {pwMutation.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </div>

          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="card-title">Two-Factor Authentication</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
              <div>
                <div style={{ fontSize: '13px' }}>Enable 2FA</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Adds extra security to your account via OTP</div>
              </div>
              <div className="toggle" onClick={e => { e.currentTarget.classList.toggle('on'); toast('2FA setup coming soon'); }} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Active Sessions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: '20px' }}>💻</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Chrome · Windows</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Current session · Bengaluru, IN</div>
              </div>
              <span className="tag tag-green">Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
              <span style={{ fontSize: '20px' }}>📱</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Safari · iPhone</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Last active 2h ago</div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => toast.success('Session revoked')}>Revoke</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NotificationsPage ──────────────────────────────────────────────────────
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import {
  WarningRegular,
  CheckmarkRegular,
  MegaphoneRegular,
  ChatRegular,
  TaskListLtrRegular,
  FolderRegular,
  TimerRegular,
  AlertRegular
} from '@fluentui/react-icons';
export function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifs = [] } = useQuery({ queryKey: ['notifications'], queryFn: () => api.get('/notifications').then(r => r.data) });
  const markAll = useMutation({ mutationFn: () => api.patch('/notifications/read-all'), onSuccess: () => qc.invalidateQueries(['notifications']) });
  const markOne = useMutation({ mutationFn: (id) => api.patch(`/notifications/${id}/read`), onSuccess: () => qc.invalidateQueries(['notifications']) });
  const typeIcon = {
    task_overdue: <WarningRegular style={{ width: '16px', height: '16px', color: 'var(--red-t)' }} />,
    task_completed: <CheckmarkRegular style={{ width: '16px', height: '16px', color: 'var(--green-t)' }} />,
    admin_broadcast: <MegaphoneRegular style={{ width: '16px', height: '16px', color: 'var(--blue-t)' }} />,
    new_message: <ChatRegular style={{ width: '16px', height: '16px', color: 'var(--amber-t)' }} />,
    task_assigned: <TaskListLtrRegular style={{ width: '16px', height: '16px', color: 'var(--teal-t)' }} />,
    file_uploaded: <FolderRegular style={{ width: '16px', height: '16px', color: 'var(--purple-t)' }} />,
    deadline_reminder: <TimerRegular style={{ width: '16px', height: '16px', color: 'var(--amber-t)' }} />
  };
  const typeBg = { task_overdue: 'var(--red-bg)', task_completed: 'var(--green-bg)', admin_broadcast: 'var(--blue-bg)', new_message: 'var(--amber-bg)', task_assigned: 'var(--teal-bg)', file_uploaded: 'var(--purple-bg)', deadline_reminder: 'var(--amber-bg)' };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Notifications</div>
        <button className="btn btn-sm" onClick={() => markAll.mutate()}>Mark all read</button>
      </div>
      <div className="card">
        {notifs.length === 0 ? <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>You're all caught up!</div>
          : notifs.map(n => (
          <div key={n._id} className="notif-item" style={{ opacity: n.read ? 0.6 : 1, cursor: 'pointer' }} onClick={() => !n.read && markOne.mutate(n._id)}>
            {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: '8px' }} />}
            <div className="notif-icon" style={{ background: typeBg[n.type] || 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {typeIcon[n.type] || <AlertRegular style={{ width: '16px', height: '16px' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: n.read ? 400 : 500 }}>{n.title}</div>
              {n.body && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{n.body}</div>}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text3)', flexShrink: 0 }}>
              {new Date(n.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default NotificationsPage;

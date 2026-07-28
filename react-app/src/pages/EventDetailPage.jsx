import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useEventContextStore } from '../store/eventContextStore';
import {
  PinRegular,
  ChatRegular,
  EditRegular,
  AddRegular,
  CheckmarkRegular,
  WarningRegular,
  DocumentRegular,
  DismissRegular,
  ArrowUploadRegular,
  CalendarRegular,
  DeleteRegular
} from '@fluentui/react-icons';

export default function EventDetailPage() {
  const { id } = useParams();
  const { hasPermission, user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', priority: 'normal', assignedTo: '' });

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { event: id }],
    queryFn: () => api.get(`/tasks?event=${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => api.get(`/documents?event=${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
    enabled: hasPermission('MANAGE_DOMAIN'),
  });

  const createTask = useMutation({
    mutationFn: (data) => api.post('/tasks', { ...data, event: id }),
    onSuccess: () => {
      qc.invalidateQueries(['tasks', { event: id }]);
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', dueDate: '', priority: 'normal', assignedTo: '' });
      toast.success('Task created!');
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, status }) => api.patch(`/tasks/${taskId}`, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks', { event: id }]),
  });

  const addMember = useMutation({
    mutationFn: (userId) => api.post(`/events/${id}/members`, { userId }),
    onSuccess: () => { qc.invalidateQueries(['event', id]); toast.success('Member added'); setShowMemberModal(false); },
  });

  const navigate = useNavigate();
  const { clearEvent } = useEventContextStore();

  const deleteEvent = useMutation({
    mutationFn: () => api.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['events']);
      qc.invalidateQueries(['overallEvents']);
      if (event.parentEvent) {
        toast.success('Subevent deleted!');
        navigate(`/events/${event.parentEvent._id || event.parentEvent}`);
      } else {
        toast.success('Overall event deleted!');
        clearEvent();
        navigate('/select-event');
      }
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId) => api.delete(`/events/${id}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries(['event', id]);
      toast.success('Member removed');
    },
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)' }}>Loading event…</div>;
  if (!event) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--red)' }}>Event not found.</div>;

  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const rate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const isOverallEvent = !event.parentEvent;
  const statusColor = { active: 'tag-blue', planning: 'tag-green', completed: 'tag-teal', draft: 'tag-purple', cancelled: 'tag-red' };
  const TABS = [
    ['overview', 'Overview'],
    ['tasks', `Tasks (${tasks.length})`],
    ['team', `Team (${event.members?.length || 0})`],
    ['files', `Files (${docs.length})`],
    ['timeline', 'Timeline'],
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
        <Link to="/events" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Events</Link>
        {' '}/{' '}<span style={{ color: 'var(--text)' }}>{event.name}</span>
      </div>

      {/* Event header card */}
      <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '18px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '18px', fontWeight: 500 }}>{event.name}</div>
              <span className={`tag ${statusColor[event.status] || 'tag-blue'}`} style={{ textTransform: 'capitalize' }}>{event.status}</span>
              {event.domain && (
                <span className="tag" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>{event.domain.name}</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>
              {event.startDate && new Date(event.startDate).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
              {event.endDate && ` – ${new Date(event.endDate).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`}
              {event.venue && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
                  · <PinRegular style={{ width: '12px', height: '12px' }} /> {event.venue}
                </span>
              )}
              {event.eventHead && ` · Head: ${event.eventHead.name}`}
            </div>
            {event.description && (
              <div style={{ fontSize: '13px', color: 'var(--text2)', maxWidth: '600px', lineHeight: 1.6 }}>{event.description}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
            <Link to="/chat" className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ChatRegular style={{ width: '14px', height: '14px' }} /> Chat
            </Link>
            {hasPermission('CREATE_EVENT') && (
              <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <EditRegular style={{ width: '14px', height: '14px' }} /> Edit Event
              </button>
            )}
            {user?.role === 'admin' && (
              <button 
                className="btn btn-sm" 
                onClick={() => {
                  if (confirm('Delete this event and all its tasks?')) {
                    deleteEvent.mutate();
                  }
                }}
                disabled={deleteEvent.isPending}
                style={{ background: 'var(--red)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <DeleteRegular style={{ width: '14px', height: '14px' }} /> Delete
              </button>
            )}
            {hasPermission('CREATE_EVENT') && isOverallEvent && (
              <button className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowSubModal(true)}>
                <AddRegular style={{ width: '14px', height: '14px' }} /> Subevent
              </button>
            )}
            {hasPermission('ASSIGN_TASK') && !isOverallEvent && (
              <button className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowTaskModal(true)}>
                <AddRegular style={{ width: '14px', height: '14px' }} /> Task
              </button>
            )}
          </div>
        </div>

        {/* Progress bar + member avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>
              <span>{rate}% complete</span>
              <span>
                {completed}/{tasks.length} tasks
                {overdueCount > 0 && <span style={{ color: 'var(--red)', marginLeft: '6px' }}>{overdueCount} overdue</span>}
              </span>
            </div>
            <div className="pbar">
              <div className="pfill" style={{ width: `${rate}%`, background: event.domain?.color || 'var(--blue)' }} />
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            {event.members?.slice(0, 6).map((m, i) => (
              <div key={m._id} title={m.name} className="av av-blue"
                style={{ width: '28px', height: '28px', fontSize: '10px', border: '2px solid var(--surface)', marginLeft: i > 0 ? '-8px' : '0', zIndex: 6 - i, position: 'relative' }}>
                {m.name?.slice(0, 2).toUpperCase()}
              </div>
            ))}
            {(event.members?.length || 0) > 6 && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface2)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text3)', marginLeft: '-8px' }}>
                +{event.members.length - 6}
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{event.members?.length || 0} members</div>
          {event.budget?.total > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
              Budget: ₹{(event.budget.spent || 0).toLocaleString()} / ₹{event.budget.total.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="inner-tabs">
        {TABS.map(([key, label]) => (
          <div key={key} className={`itab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</div>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div>
          <div className="g3" style={{ marginBottom: '14px' }}>
            <div className="metric">
              <div className="metric-label">Days to event</div>
              <div className="metric-value">
                {event.startDate ? Math.max(0, Math.ceil((new Date(event.startDate) - new Date()) / 86400000)) : '—'}
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">Overdue tasks</div>
              <div className="metric-value" style={{ color: overdueCount > 0 ? 'var(--red)' : 'var(--text)' }}>{overdueCount}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Completion rate</div>
              <div className="metric-value">{rate}%</div>
            </div>
          </div>
          <div className="g2">
            <div className="card">
              <div className="card-title">Pending actions</div>
              {tasks.filter(t => t.status !== 'completed').slice(0, 6).map(t => (
                <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: t.status === 'overdue' ? 'var(--red)' : t.status === 'in_progress' ? 'var(--blue)' : 'var(--text3)' }} />
                  <div style={{ flex: 1, fontSize: '13px', color: t.status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>{t.title}</div>
                  {t.assignedTo && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{t.assignedTo.name?.split(' ')[0]}</div>}
                  <span style={{ fontSize: '11px', color: t.status === 'overdue' ? 'var(--red)' : 'var(--text3)' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              ))}
              {tasks.filter(t => t.status !== 'completed').length === 0 && (
                <div style={{ color: 'var(--green)', fontSize: '13px', padding: '8px 0' }}>✓ All tasks completed!</div>
              )}
            </div>
            <div className="card">
              <div className="card-title">Task breakdown</div>
              {[['completed', 'Completed', 'var(--green)'], ['in_progress', 'In Progress', 'var(--amber)'], ['pending', 'Pending', 'var(--blue)'], ['overdue', 'Overdue', 'var(--red)']].map(([status, label, color]) => {
                const count = tasks.filter(t => t.status === status).length;
                const pct = tasks.length ? (count / tasks.length) * 100 : 0;
                return (
                  <div key={status} className="anbar">
                    <div className="anbar-label">{label}</div>
                    <div className="anbar-track"><div className="anbar-fill" style={{ width: `${pct}%`, background: color }} /></div>
                    <div className="anbar-val">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tasks ── */}
      {tab === 'tasks' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{tasks.length} tasks total</div>
            {hasPermission('ASSIGN_TASK') && (
              <button className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowTaskModal(true)}>
                <AddRegular style={{ width: '14px', height: '14px' }} /> New Task
              </button>
            )}
          </div>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>No tasks yet. Create the first one!</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr><th style={{ width: '26px' }}></th><th>Task</th><th>Assigned to</th><th>Due</th><th>Priority</th><th>Status</th></tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div onClick={() => updateTask.mutate({ taskId: t._id, status: t.status === 'completed' ? 'pending' : 'completed' })}
                        style={{ width: '15px', height: '15px', borderRadius: '3px', cursor: 'pointer', background: t.status === 'completed' ? 'var(--green)' : 'transparent', border: `1.5px solid ${t.status === 'overdue' ? 'var(--red)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        {t.status === 'completed' ? <CheckmarkRegular style={{ width: '10px', height: '10px' }} /> : ''}
                      </div>
                    </td>
                    <td style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'overdue' ? 'var(--red)' : t.status === 'completed' ? 'var(--text3)' : 'var(--text)' }}>
                      {t.title}
                      {t.source === 'chat' && <ChatRegular style={{ width: '12px', height: '12px', marginLeft: '5px', color: 'var(--blue-t)' }} />}
                    </td>
                    <td>
                      {t.assignedTo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div className="av av-blue" style={{ width: '20px', height: '20px', fontSize: '9px' }}>{t.assignedTo.name?.slice(0, 2).toUpperCase()}</div>
                          <span style={{ fontSize: '12px' }}>{t.assignedTo.name?.split(' ')[0]}</span>
                        </div>
                      ) : <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Unassigned</span>}
                    </td>
                    <td style={{ fontSize: '12px', color: t.status === 'overdue' ? 'var(--red)' : 'var(--text3)', display: 'inline-flex', alignItems: 'center' }}>
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                      {t.status === 'overdue' && <WarningRegular style={{ width: '12px', height: '12px', color: 'var(--red)', marginLeft: '4px' }} />}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', textTransform: 'capitalize', color: t.priority === 'critical' ? 'var(--red)' : t.priority === 'high' ? 'var(--amber)' : 'var(--text3)' }}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`tag ${t.status === 'completed' ? 'tag-green' : t.status === 'overdue' ? 'tag-red' : t.status === 'in_progress' ? 'tag-amber' : 'tag-blue'}`} style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                        {t.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Team ── */}
      {tab === 'team' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{event.members?.length || 0} members</div>
            {hasPermission('MANAGE_DOMAIN') && (
              <button className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowMemberModal(true)}>
                <AddRegular style={{ width: '14px', height: '14px' }} /> Add Member
              </button>
            )}
          </div>
          <table className="tbl">
            <thead><tr><th>Member</th><th>Role</th><th>Email</th><th>Permissions</th></tr></thead>
            <tbody>
              {event.members?.map(m => (
                <tr key={m._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="av av-blue" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{m.name?.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '12px' }}>{m.name}</div>
                        {m._id === event.eventHead?._id && <div style={{ fontSize: '10px', color: 'var(--blue-t)' }}>Event Head</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="tag tag-teal" style={{ fontSize: '10px', textTransform: 'capitalize' }}>{m.role?.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text3)' }}>{m.email}</td>
                  <td>
                    {hasPermission('MANAGE_DOMAIN') && (
                      <button 
                        className="btn btn-sm" 
                        disabled={removeMember.isPending}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: 'none' }}
                        onClick={() => removeMember.mutate(m._id)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Files ── */}
      {tab === 'files' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            {hasPermission('UPLOAD_DOCS') && (
              <Link to="/documents" className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUploadRegular style={{ width: '14px', height: '14px' }} /> Upload File
              </Link>
            )}
          </div>
          {docs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>No files uploaded yet.</div>
          ) : docs.map(doc => (
            <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-t)', flexShrink: 0 }}>
                <DocumentRegular style={{ width: '20px', height: '20px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{doc.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                  {doc.uploadedBy?.name} · {new Date(doc.createdAt).toLocaleDateString()}
                  <span style={{ marginLeft: '8px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface2)', fontSize: '10px' }}>{doc.accessModel}</span>
                </div>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">Preview</a>
              <a href={doc.url} download={doc.name} className="btn btn-sm">Download</a>
            </div>
          ))}
        </div>
      )}

      {/* ── Timeline ── */}
      {tab === 'timeline' && (
        <div className="card">
          <div className="card-title">Event Timeline</div>
          <div style={{ position: 'relative', paddingLeft: '28px' }}>
            <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '1.5px', background: 'var(--border2)' }} />
            {tasks
              .filter(t => t.status === 'completed' || t.completedAt)
              .sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt))
              .map(t => (
                <div key={t._id} style={{ position: 'relative', marginBottom: '16px' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--surface)' }} />
                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    Completed {t.completedAt ? new Date(t.completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                    {t.assignedTo && ` · by ${t.assignedTo.name}`}
                  </div>
                </div>
              ))}
            {event.startDate && (
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <div style={{ position: 'absolute', left: '-22px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--purple)', border: '2px solid var(--surface)' }} />
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--purple)' }}>
                  {new Date(event.startDate).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })} — Event Day
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{event.venue || 'Venue TBD'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-bg open">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowTaskModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DismissRegular style={{ width: '18px', height: '18px' }} />
            </button>
            <div className="modal-title">Create Task for {event.name}</div>
            <div className="field"><label className="label">Title *</label>
              <input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task name…" />
            </div>
            <div className="field"><label className="label">Description</label>
              <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details…" />
            </div>
            <div className="g2" style={{ marginBottom: '14px' }}>
              <div><label className="label">Due date</label>
                <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div><label className="label">Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="field"><label className="label">Assign to</label>
              <select value={taskForm.assignedTo} onChange={e => setTaskForm(f => ({ ...f, assignedTo: e.target.value }))}>
                <option value="">Unassigned</option>
                {event.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '9px', marginTop: '6px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={!taskForm.title || createTask.isPending}
                onClick={() => createTask.mutate(taskForm)}>
                {createTask.isPending ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-bg open">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowMemberModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DismissRegular style={{ width: '18px', height: '18px' }} />
            </button>
            <div className="modal-title">Add Member to {event.name}</div>
            <div className="field">
              <label className="label">Select User</label>
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                <option value="">Choose a user...</option>
                {users
                  .filter(u => !event.members?.some(m => m._id === u._id))
                  .map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role?.replace('_', ' ')})</option>
                  ))
                }
              </select>
            </div>
            <div style={{ display: 'flex', gap: '9px', marginTop: '20px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowMemberModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={!selectedUserId || addMember.isPending}
                onClick={() => {
                  addMember.mutate(selectedUserId, {
                    onSuccess: () => {
                      setShowMemberModal(false);
                      setSelectedUserId('');
                    }
                  });
                }}
              >
                {addMember.isPending ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import {
  AddRegular,
  ChatRegular,
  EyeRegular,
  DeleteRegular,
  DismissRegular,
  CheckmarkRegular,
  WarningRegular
} from '@fluentui/react-icons';

export default function TasksPage() {
  const { user, hasPermission } = useAuthStore();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ event: '', status: '', priority: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', priority: 'normal', assignedTo: '', event: '' });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      return api.get(`/tasks?${params}`).then(r => r.data);
    },
  });

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then(r => r.data), enabled: hasPermission('ASSIGN_TASK') });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/tasks', data),
    onSuccess: () => { qc.invalidateQueries(['tasks']); setShowModal(false); toast.success('Task created!'); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });

  const deleteTask = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Task deleted'); },
  });

  const statusColor = { pending: 'tag-blue', in_progress: 'tag-amber', completed: 'tag-green', overdue: 'tag-red' };
  const priorityColor = { low: '', normal: '', high: 'tag-amber', critical: 'tag-red' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Task Management</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select value={filters.event} onChange={e => setFilters(f => ({ ...f, event: e.target.value }))} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">All events</option>
            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          {hasPermission('ASSIGN_TASK') && (
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowModal(true)}>
              <AddRegular style={{ width: '14px', height: '14px' }} /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>No tasks found.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '26px' }}></th>
                <th>Task</th>
                <th>Event</th>
                <th>Assigned to</th>
                <th>Due date</th>
                <th>Priority</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id}>
                  <td>
                    <div
                      onClick={() => updateStatus.mutate({ id: task._id, status: task.status === 'completed' ? 'pending' : 'completed' })}
                      style={{ width: '15px', height: '15px', borderRadius: '3px', cursor: 'pointer', background: task.status === 'completed' ? 'var(--green)' : 'transparent', border: `1.5px solid ${task.status === 'completed' ? 'var(--green)' : task.status === 'overdue' ? 'var(--red)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                    >
                      {task.status === 'completed' && <CheckmarkRegular style={{ width: '10px', height: '10px' }} />}
                    </div>
                  </td>
                  <td style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text3)' : task.status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>
                    {task.title}
                    {task.source === 'chat' && <ChatRegular style={{ width: '12px', height: '12px', color: 'var(--blue-t)', marginLeft: '5px' }} />}
                  </td>
                  <td>{task.event && <span className="tag tag-blue" style={{ fontSize: '11px' }}>{task.event.name}</span>}</td>
                  <td>
                    {task.assignedTo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div className="av av-blue" style={{ width: '22px', height: '22px', fontSize: '9px' }}>{task.assignedTo.name?.slice(0, 2).toUpperCase()}</div>
                        <span style={{ fontSize: '12px' }}>{task.assignedTo.name?.split(' ')[0]}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Unassigned</span>}
                  </td>
                  <td style={{ fontSize: '12px', color: task.status === 'overdue' ? 'var(--red)' : 'var(--text2)', display: 'inline-flex', alignItems: 'center' }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                    {task.status === 'overdue' && <WarningRegular style={{ width: '12px', height: '12px', color: 'var(--red)', marginLeft: '4px' }} />}
                  </td>
                  <td>
                    {task.priority !== 'normal' && task.priority !== 'low'
                      ? <span className={`tag ${priorityColor[task.priority] || ''}`} style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                      : <span style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'capitalize' }}>{task.priority}</span>}
                  </td>
                  <td><span className={`tag ${statusColor[task.status] || 'tag-blue'}`} style={{ textTransform: 'capitalize' }}>{task.status?.replace('_', ' ')}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setSelectedTask(task)}>
                        <EyeRegular style={{ width: '12px', height: '12px' }} /> View
                      </button>
                      {hasPermission('DELETE_CONTENT') && (
                        <button className="btn btn-sm btn-danger" style={{ display: 'flex', alignItems: 'center' }} onClick={() => deleteTask.mutate(task._id)}>
                          <DeleteRegular style={{ width: '12px', height: '12px' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-bg open">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DismissRegular style={{ width: '18px', height: '18px' }} />
            </button>
            <div className="modal-title">Create Task</div>
            <div className="field"><label className="label">Title *</label><input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task name…" /></div>
            <div className="field"><label className="label">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details…" /></div>
            <div className="g2" style={{ marginBottom: '14px' }}>
              <div><label className="label">Due date</label><input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div><label className="label">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="field"><label className="label">Assign to</label>
              <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div className="field"><label className="label">Event *</label>
              <select value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))}>
                <option value="">Select event…</option>
                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '9px', marginTop: '6px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={!form.title || !form.event || createMutation.isPending}
                onClick={() => createMutation.mutate(form)}>
                {createMutation.isPending ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="modal-bg open">
          <div className="modal" style={{ width: '500px' }}>
            <button className="modal-close" onClick={() => setSelectedTask(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DismissRegular style={{ width: '18px', height: '18px' }} />
            </button>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span>Task Details</span>
              {selectedTask.source === 'chat' && <span style={{ fontSize: '11px', fontWeight: 'normal' }} className="tag tag-blue">AI-Generated</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Title</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{selectedTask.title}</div>
              </div>

              {selectedTask.description && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Description</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', background: 'var(--surface2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                    {selectedTask.description}
                  </div>
                </div>
              )}

              <div className="g2">
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Status</div>
                  <span className={`tag ${statusColor[selectedTask.status] || 'tag-blue'}`} style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                    {selectedTask.status?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Priority</div>
                  <span className={`tag ${priorityColor[selectedTask.priority] || 'tag-blue'}`} style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              <div className="g2">
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Event</div>
                  {selectedTask.event ? (
                    <span className="tag tag-blue" style={{ fontSize: '11px' }}>{selectedTask.event.name}</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text3)' }}>—</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Assigned To</div>
                  {selectedTask.assignedTo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="av av-blue" style={{ width: '22px', height: '22px', fontSize: '9px' }}>
                        {selectedTask.assignedTo.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text)' }}>{selectedTask.assignedTo.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Unassigned</span>
                  )}
                </div>
              </div>

              <div className="g2">
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Created At</div>
                  <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                    {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Due Date</div>
                  <div style={{ fontSize: '12px', color: selectedTask.status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '9px', marginTop: '24px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

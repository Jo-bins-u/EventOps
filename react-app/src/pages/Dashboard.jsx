import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import {
  CheckmarkRegular,
  WarningRegular,
  MegaphoneRegular,
  ChatRegular
} from '@fluentui/react-icons';

import { useEventContextStore } from '../store/eventContextStore';
import LoadingScreen from '../components/LoadingScreen';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { selectedEvent } = useEventContextStore();

  const { data: parentEvent, isLoading: parentLoading } = useQuery({
    queryKey: ['parentEvent', selectedEvent?.id],
    queryFn: () => api.get(`/events/${selectedEvent.id}`).then(r => r.data),
    enabled: !!selectedEvent?.id,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  });

  if (parentLoading || eventsLoading || tasksLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  // Scope subevents
  const subEvents = events.filter(
    (e) => e.parentEvent === selectedEvent?.id || e.parentEvent?._id === selectedEvent?.id
  );
  const subEventsIds = subEvents.map((se) => se._id);

  // Scope tasks belonging to the subevents
  const scopedTasks = tasks.filter((t) => subEventsIds.includes(t.event?._id || t.event));
  const completedTasks = scopedTasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = scopedTasks.filter((t) => t.status === 'overdue').length;
  const completionRate = scopedTasks.length ? Math.round((completedTasks / scopedTasks.length) * 100) : 0;

  const myTasks = scopedTasks.slice(0, 6);
  const upcomingEvents = subEvents.filter((e) => e.status !== 'completed').slice(0, 5);
  const recentNotifs = notifications.slice(0, 4);

  const statusColor = { active: 'tag-blue', planning: 'tag-green', setup: 'tag-amber', completed: 'tag-teal', draft: 'tag-purple' };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Good morning, {user?.name?.split(' ')[0]} 👋</div>
        <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '3px' }}>Here's what's happening today.</div>
      </div>

      {/* Metrics */}
      <div className="g4" style={{ marginBottom: '18px' }}>
        <div className="metric">
          <div className="metric-label">Active Subevents</div>
          <div className="metric-value">{upcomingEvents.length}</div>
          <div className="metric-sub" style={{ color: 'var(--blue)' }}>Scope: {selectedEvent?.name}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Total Tasks</div>
          <div className="metric-value">{scopedTasks.length}</div>
          <div className="metric-sub">{completedTasks} completed</div>
        </div>
        <div className="metric">
          <div className="metric-label">Team Members</div>
          <div className="metric-value">{parentEvent?.members?.length || 0}</div>
          <div className="metric-sub">Event participants</div>
        </div>
        <div className="metric">
          <div className="metric-label">Completion Rate</div>
          <div className="metric-value">{completionRate}%</div>
          <div className="metric-sub" style={{ color: overdueTasks > 0 ? 'var(--red)' : 'var(--green)' }}>{overdueTasks} overdue</div>
        </div>
      </div>

      <div className="g2">
        {/* Upcoming Events */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="card-title" style={{ margin: 0 }}>Upcoming Events</div>
            <Link to="/events" style={{ fontSize: '12px', color: 'var(--blue)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {upcomingEvents.length === 0 ? <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No upcoming events.</div> : upcomingEvents.map(ev => (
            <Link key={ev._id} to={`/events/${ev._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 0', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ev.domain?.color || 'var(--blue)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '13px' }}>{ev.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{ev.domain?.name} · {ev.startDate ? new Date(ev.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'TBD'}</div>
                </div>
                <span className={`tag ${statusColor[ev.status] || 'tag-blue'}`}>{ev.status}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* My Tasks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="card-title" style={{ margin: 0 }}>My Tasks</div>
            <Link to="/tasks" style={{ fontSize: '12px', color: 'var(--blue)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {myTasks.length === 0 ? <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No tasks assigned.</div> : myTasks.map(task => (
            <div key={task._id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, background: task.status === 'completed' ? 'var(--green)' : 'transparent', border: task.status === 'completed' ? 'none' : `1.5px solid ${task.status === 'overdue' ? 'var(--red)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                {task.status === 'completed' ? <CheckmarkRegular style={{ width: '10px', height: '10px' }} /> : ''}
              </div>
              <div style={{ flex: 1, fontSize: '13px', textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text3)' : task.status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>
                {task.title}
              </div>
              <span style={{ fontSize: '11px', color: task.status === 'overdue' ? 'var(--red)' : 'var(--text3)', display: 'inline-flex', alignItems: 'center' }}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                {task.status === 'overdue' && <WarningRegular style={{ width: '11px', height: '11px', color: 'var(--red)', marginLeft: '4px' }} />}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="g2" style={{ marginTop: '14px' }}>
        {/* Event Progress */}
        <div className="card">
          <div className="card-title">Subevent Progress</div>
          {subEvents.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No subevents created yet.</div>
          ) : (
            subEvents.slice(0, 5).map(ev => (
              <div key={ev._id} className="anbar">
                <div className="anbar-label">{ev.name}</div>
                <div className="anbar-track"><div className="anbar-fill" style={{ width: `${ev.completionRate || 0}%`, background: ev.domain?.color || 'var(--blue)' }} /></div>
                <div className="anbar-val">{ev.completionRate || 0}%</div>
              </div>
            ))
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="card-title" style={{ margin: 0 }}>Recent Notifications</div>
            <Link to="/notifications" style={{ fontSize: '12px', color: 'var(--blue)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentNotifs.map(n => (
            <div key={n._id} className="notif-item">
              <div className="notif-icon" style={{ background: n.type === 'task_overdue' ? 'var(--red-bg)' : n.type === 'task_completed' ? 'var(--green-bg)' : n.type === 'admin_broadcast' ? 'var(--blue-bg)' : 'var(--amber-bg)' }}>
                {n.type === 'task_overdue' ? (
                  <WarningRegular style={{ width: '14px', height: '14px', color: 'var(--red-t)' }} />
                ) : n.type === 'task_completed' ? (
                  <CheckmarkRegular style={{ width: '14px', height: '14px', color: 'var(--green-t)' }} />
                ) : n.type === 'admin_broadcast' ? (
                  <MegaphoneRegular style={{ width: '14px', height: '14px', color: 'var(--blue-t)' }} />
                ) : (
                  <ChatRegular style={{ width: '14px', height: '14px', color: 'var(--amber-t)' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{n.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{n.body}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text3)', flexShrink: 0 }}>
                {new Date(n.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

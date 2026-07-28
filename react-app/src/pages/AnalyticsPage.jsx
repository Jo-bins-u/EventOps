import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../utils/api';
import { useEventContextStore } from '../store/eventContextStore';
import LoadingScreen from '../components/LoadingScreen';

export default function AnalyticsPage() {
  const { selectedEvent } = useEventContextStore();

  const { data: parentEvent, isLoading: parentLoading } = useQuery({
    queryKey: ['parentEvent', selectedEvent?.id],
    queryFn: () => api.get(`/events/${selectedEvent.id}`).then(r => r.data),
    enabled: !!selectedEvent?.id,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({ 
    queryKey: ['events'], 
    queryFn: () => api.get('/events').then(r => r.data) 
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: () => api.get('/tasks').then(r => r.data) 
  });

  if (parentLoading || eventsLoading || tasksLoading) {
    return <LoadingScreen message="Loading analytics..." />;
  }

  // Filter subevents
  const subEvents = events.filter(e => e.parentEvent === selectedEvent?.id || e.parentEvent?._id === selectedEvent?.id);
  const subEventsIds = subEvents.map(se => se._id);

  // Filter tasks
  const scopedTasks = tasks.filter(t => subEventsIds.includes(t.event?._id || t.event));

  // Compute overview metrics
  const totalTasks = scopedTasks.length;
  const completedTasks = scopedTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = scopedTasks.filter(t => t.status === 'overdue').length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeEventsCount = subEvents.filter(e => e.status !== 'completed').length;
  const membersCount = parentEvent?.members?.length || 0;

  // Compute event stats
  const eventStats = subEvents.map(se => {
    const seTasks = tasks.filter(t => (t.event?._id || t.event) === se._id);
    const comp = seTasks.filter(t => t.status === 'completed').length;
    return {
      _id: se._id,
      name: se.name,
      completed: comp,
      total: seTasks.length,
      completionRate: seTasks.length ? Math.round((comp / seTasks.length) * 100) : 0
    };
  });

  // Compute member stats
  const memberStats = (parentEvent?.members || []).map(m => {
    const mTasks = scopedTasks.filter(t => (t.assignedTo?._id || t.assignedTo) === m._id);
    return {
      _id: m._id,
      name: m.name,
      completed: mTasks.filter(t => t.status === 'completed').length,
      total: mTasks.length
    };
  }).filter(ms => ms.total > 0).sort((a, b) => b.completed - a.completed);

  // Compute weekly timeline
  const timeline = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i * 7);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const weekLabel = `Wk ${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`;
    const createdCount = scopedTasks.filter(t => {
      const createdDate = new Date(t.createdAt);
      return createdDate >= startOfWeek && createdDate <= endOfWeek;
    }).length;
    
    const completedCount = scopedTasks.filter(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= startOfWeek && completedDate <= endOfWeek;
    }).length;
    
    timeline.push({ week: weekLabel, created: createdCount, completed: completedCount });
  }

  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '18px' }}>Analytics Dashboard</div>

      {/* Overview metrics */}
      <div className="g4" style={{ marginBottom: '18px' }}>
        <div className="metric"><div className="metric-label">Tasks Completed</div><div className="metric-value">{completedTasks}</div><div className="metric-sub" style={{ color: 'var(--green)' }}>{completionRate}% rate</div></div>
        <div className="metric"><div className="metric-label">Overdue Tasks</div><div className="metric-value" style={{ color: 'var(--red)' }}>{overdueTasks}</div><div className="metric-sub" style={{ color: 'var(--red)' }}>Need attention</div></div>
        <div className="metric"><div className="metric-label">Active Members</div><div className="metric-value">{membersCount}</div><div className="metric-sub">Event participants</div></div>
        <div className="metric"><div className="metric-label">Active Subevents</div><div className="metric-value">{activeEventsCount}</div><div className="metric-sub">In progress</div></div>
      </div>

      {/* Task status breakdown */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-title">Task Status Breakdown</div>
        <div className="g4">
          <div style={{ background: 'var(--green-bg)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--green)' }}>{completedTasks}</div>
            <div style={{ fontSize: '12px', color: 'var(--green)', marginTop: '3px' }}>Completed</div>
          </div>
          <div style={{ background: 'var(--amber-bg)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--amber)' }}>{totalTasks - completedTasks - overdueTasks}</div>
            <div style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '3px' }}>In Progress</div>
          </div>
          <div style={{ background: 'var(--blue-bg)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--blue-t)' }}>{totalTasks}</div>
            <div style={{ fontSize: '12px', color: 'var(--blue-t)', marginTop: '3px' }}>Total</div>
          </div>
          <div style={{ background: 'var(--red-bg)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--red)' }}>{overdueTasks}</div>
            <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '3px' }}>Overdue</div>
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: '14px' }}>
        {/* Event completion bar chart */}
        <div className="card">
          <div className="card-title">Task Completion by Subevent</div>
          {eventStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventStats} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={v => v.split(' ')[0]} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="completionRate" fill="var(--blue)" radius={[3, 3, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>No subevent data yet.</div>
          )}
        </div>

        {/* Member activity */}
        <div className="card">
          <div className="card-title">Member Activity (Tasks Done)</div>
          {memberStats.length > 0 ? (
            memberStats.slice(0, 6).map((m, i) => {
              const colors = ['var(--blue)', 'var(--purple)', 'var(--teal)', 'var(--amber)', 'var(--red)', 'var(--green)'];
              const max = memberStats[0]?.completed || 1;
              return (
                <div key={m._id} className="anbar">
                  <div className="anbar-label">{m.name.split(' ')[0]} {m.name.split(' ')[1]?.[0]}.</div>
                  <div className="anbar-track"><div className="anbar-fill" style={{ width: `${(m.completed / max) * 100}%`, background: colors[i % colors.length] }} /></div>
                  <div className="anbar-val">{m.completed}</div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>No member activity yet.</div>
          )}
        </div>
      </div>

      {/* Weekly trend line chart */}
      <div className="card">
        <div className="card-title">Weekly Task Trend (last 8 weeks)</div>
        {timeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeline} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="created" stroke="var(--blue)" strokeWidth={2} dot={false} name="Created" />
              <Line type="monotone" dataKey="completed" stroke="var(--green)" strokeWidth={2} dot={false} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>No timeline data yet.</div>
        )}
      </div>
    </div>
  );
}

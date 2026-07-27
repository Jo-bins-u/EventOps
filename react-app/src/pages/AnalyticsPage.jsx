import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import api from '../utils/api';

export default function AnalyticsPage() {
  const { data: overview } = useQuery({ queryKey: ['analytics-overview'], queryFn: () => api.get('/analytics/overview').then(r => r.data) });
  const { data: eventStats = [] } = useQuery({ queryKey: ['analytics-events'], queryFn: () => api.get('/analytics/events').then(r => r.data) });
  const { data: memberStats = [] } = useQuery({ queryKey: ['analytics-members'], queryFn: () => api.get('/analytics/members').then(r => r.data) });
  const { data: timeline = [] } = useQuery({ queryKey: ['analytics-timeline'], queryFn: () => api.get('/analytics/timeline').then(r => r.data) });

  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '18px' }}>Analytics Dashboard</div>

      {/* Overview metrics */}
      <div className="g4" style={{ marginBottom: '18px' }}>
        <div className="metric"><div className="metric-label">Tasks Completed</div><div className="metric-value">{overview?.completedTasks ?? '—'}</div><div className="metric-sub" style={{ color: 'var(--green)' }}>{overview?.completionRate}% rate</div></div>
        <div className="metric"><div className="metric-label">Overdue Tasks</div><div className="metric-value" style={{ color: 'var(--red)' }}>{overview?.overdueTasks ?? '—'}</div><div className="metric-sub" style={{ color: 'var(--red)' }}>Need attention</div></div>
        <div className="metric"><div className="metric-label">Active Members</div><div className="metric-value">{overview?.activeUsers ?? '—'}</div><div className="metric-sub">of {overview?.totalUsers} total</div></div>
        <div className="metric"><div className="metric-label">Active Events</div><div className="metric-value">{overview?.activeEvents ?? '—'}</div><div className="metric-sub">In progress</div></div>
      </div>

      {/* Task status breakdown */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-title">Task Status Breakdown</div>
        <div className="g4">
          <div style={{ background: 'var(--green-bg)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--green)' }}>{overview?.completedTasks ?? 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--green)', marginTop: '3px' }}>Completed</div>
          </div>
          <div style={{ background: 'var(--amber-bg)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--amber)' }}>{(overview?.totalTasks ?? 0) - (overview?.completedTasks ?? 0) - (overview?.overdueTasks ?? 0)}</div>
            <div style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '3px' }}>In Progress</div>
          </div>
          <div style={{ background: 'var(--blue-bg)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--blue-t)' }}>{overview?.totalTasks ?? 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--blue-t)', marginTop: '3px' }}>Total</div>
          </div>
          <div style={{ background: 'var(--red-bg)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--red)' }}>{overview?.overdueTasks ?? 0}</div>
            <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '3px' }}>Overdue</div>
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: '14px' }}>
        {/* Event completion bar chart */}
        <div className="card">
          <div className="card-title">Task Completion by Event</div>
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
            eventStats.map(ev => (
              <div key={ev._id} className="anbar">
                <div className="anbar-label">{ev.name}</div>
                <div className="anbar-track"><div className="anbar-fill" style={{ width: `${ev.completionRate}%`, background: 'var(--blue)' }} /></div>
                <div className="anbar-val">{ev.completionRate}%</div>
              </div>
            ))
          )}
        </div>

        {/* Member activity */}
        <div className="card">
          <div className="card-title">Member Activity (Tasks Done)</div>
          {memberStats.slice(0, 6).map((m, i) => {
            const colors = ['var(--blue)', 'var(--purple)', 'var(--teal)', 'var(--amber)', 'var(--red)', 'var(--green)'];
            const max = memberStats[0]?.completed || 1;
            return (
              <div key={m._id} className="anbar">
                <div className="anbar-label">{m.name.split(' ')[0]} {m.name.split(' ')[1]?.[0]}.</div>
                <div className="anbar-track"><div className="anbar-fill" style={{ width: `${(m.completed / max) * 100}%`, background: colors[i % colors.length] }} /></div>
                <div className="anbar-val">{m.completed}</div>
              </div>
            );
          })}
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

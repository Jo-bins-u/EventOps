import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, addDays, startOfDay, format } from 'date-fns';
import api from '../utils/api';
import { useEventContextStore } from '../store/eventContextStore';
import {
  DismissRegular,
  ArrowResetRegular,
  ArrowDownloadRegular
} from '@fluentui/react-icons';

const STATUS_COLORS = { completed: '#3B6D11', in_progress: '#185FA5', overdue: '#A32D2D', pending: '#888780' };
const PRIORITY_BORDER = { critical: '#A32D2D', high: '#854F0B', normal: 'transparent', low: 'transparent' };

export default function GanttPage() {
  const { selectedEvent: selectedOverallEvent } = useEventContextStore();
  const [selectedEvent, setSelectedEvent] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) });
  
  const subEvents = events.filter(e => e.parentEvent === selectedOverallEvent?.id || e.parentEvent?._id === selectedOverallEvent?.id);

  const { data: tasks = [] } = useQuery({
    queryKey: ['gantt-tasks', selectedEvent],
    queryFn: () => api.get(`/analytics/gantt/${selectedEvent}`).then(r => r.data),
    enabled: !!selectedEvent,
  });

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'all') return tasks;
    return tasks.filter(t => t.status === filterStatus);
  }, [tasks, filterStatus]);

  // Helper to calculate start & end dates of a task naturally
  const getTaskDates = (task) => {
    const created = startOfDay(new Date(task.createdAt));
    let start = created;
    let end = created;
    if (task.dueDate) {
      const due = startOfDay(new Date(task.dueDate));
      const fiveDaysBeforeDue = addDays(due, -5);
      // Ensure start date is 5 days before due or created, whichever is earlier
      start = fiveDaysBeforeDue < created ? fiveDaysBeforeDue : created;
      end = due;
    } else {
      end = addDays(created, 5);
    }
    return { start, end };
  };

  // Compute date range for chart
  const { chartStart, chartEnd, totalDays } = useMemo(() => {
    if (!filteredTasks.length) {
      const defaultStart = customStart ? startOfDay(new Date(customStart)) : new Date();
      const defaultEnd = customEnd ? startOfDay(new Date(customEnd)) : addDays(defaultStart, 30);
      const total = Math.max(differenceInDays(defaultEnd, defaultStart), 1);
      return { chartStart: defaultStart, chartEnd: defaultEnd, totalDays: total };
    }

    const taskDatesList = filteredTasks.map(t => getTaskDates(t));
    const dates = taskDatesList.flatMap(td => [td.start, td.end]);
    
    let min = startOfDay(new Date(Math.min(...dates)));
    let max = startOfDay(addDays(new Date(Math.max(...dates)), 3));

    if (customStart) {
      min = startOfDay(new Date(customStart));
    }
    if (customEnd) {
      max = startOfDay(new Date(customEnd));
    }

    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }

    const total = Math.max(differenceInDays(max, min), 1);
    return { chartStart: min, chartEnd: max, totalDays: total };
  }, [filteredTasks, customStart, customEnd]);

  const getBarStyle = (task) => {
    const { start, end } = getTaskDates(task);
    
    // Check if task is completely out of chart range
    if (end < chartStart || start > chartEnd) {
      return { display: 'none' };
    }

    // Clip start and end to chart boundaries
    const visualStart = start < chartStart ? chartStart : start;
    const visualEnd = end > chartEnd ? chartEnd : end;

    const left = (differenceInDays(visualStart, chartStart) / totalDays) * 100;
    const width = Math.max((differenceInDays(visualEnd, visualStart) / totalDays) * 100, 1.5);

    return { 
      left: `${Math.max(0, left)}%`, 
      width: `${Math.min(width, 100 - Math.max(0, left))}%`,
      display: 'flex'
    };
  };

  const today = startOfDay(new Date());
  const todayOffset = (differenceInDays(today, chartStart) / totalDays) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Gantt Chart</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">Select subevent…</option>
            {subEvents.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>From:</span>
            <input 
              type="date" 
              value={customStart} 
              onChange={e => setCustomStart(e.target.value)} 
              style={{ width: 'auto', padding: '5px 8px', fontSize: '11px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)' }} 
            />
            <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>To:</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={e => setCustomEnd(e.target.value)} 
              style={{ width: 'auto', padding: '5px 8px', fontSize: '11px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)' }} 
            />
            {(customStart || customEnd) && (
              <button 
                className="btn btn-sm btn-danger" 
                onClick={() => { setCustomStart(''); setCustomEnd(''); }}
                style={{ padding: '4px 8px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowResetRegular style={{ width: '11px', height: '11px' }} /> Reset
              </button>
            )}
          </div>
          <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDownloadRegular style={{ width: '12px', height: '12px' }} /> Export PNG
          </button>
        </div>
      </div>

      {!selectedEvent ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>Select an event to view its Gantt chart.</div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>No tasks found for the selected filters.</div>
      ) : (
        <div className="card">
          {/* Date header */}
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border2)', paddingBottom: '8px', marginBottom: '4px' }}>
            <div style={{ width: '180px', flexShrink: 0, fontSize: '11px', fontWeight: 500, color: 'var(--text3)' }}>TASK</div>
            <div style={{ flex: 1, position: 'relative', height: '16px' }}>
              {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const d = addDays(chartStart, Math.round(totalDays * pct));
                return (
                  <span key={pct} style={{ position: 'absolute', left: `${pct * 100}%`, transform: 'translateX(-50%)', fontSize: '10px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {format(d, 'MMM d')}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Task rows */}
          {filteredTasks.map(task => {
            const barStyle = getBarStyle(task);
            if (barStyle.display === 'none') return null;
            return (
              <div key={task._id} style={{ display: 'flex', alignItems: 'center', height: '38px', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                <div style={{ width: '180px', flexShrink: 0, fontSize: '12px', paddingRight: '12px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.title}>
                  {task.title}
                </div>
                <div style={{ flex: 1, position: 'relative', height: '22px' }}>
                  {/* Today marker */}
                  {todayOffset >= 0 && todayOffset <= 100 && (
                    <div style={{ position: 'absolute', left: `${todayOffset}%`, top: 0, bottom: 0, width: '1.5px', background: 'var(--purple)', opacity: 0.5, zIndex: 1 }} />
                  )}
                  <div
                    style={{
                      position: 'absolute', height: '100%', borderRadius: '4px',
                      background: STATUS_COLORS[task.status] || '#888',
                      borderLeft: `3px solid ${PRIORITY_BORDER[task.priority] || 'transparent'}`,
                      display: 'flex', alignItems: 'center', padding: '0 7px',
                      fontSize: '10px', color: '#fff', fontWeight: 500,
                      overflow: 'hidden', whiteSpace: 'nowrap',
                      ...barStyle,
                    }}
                  >
                    {task.title}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '0.5px solid var(--border)' }}>
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span key={status} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text3)' }}>
                <span style={{ width: '10px', height: '10px', background: color, borderRadius: '2px', display: 'inline-block' }} />
                {status.replace('_', ' ')}
              </span>
            ))}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text3)' }}>
              <span style={{ width: '2px', height: '10px', background: 'var(--purple)', display: 'inline-block' }} />
              Today
            </span>
          </div>
        </div>
      )}

      {/* Task detail panel */}
      {selectedTask && (
        <div className="card" style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="card-title" style={{ margin: 0 }}>Task Details</div>
            <button className="btn btn-sm" onClick={() => setSelectedTask(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <DismissRegular style={{ width: '12px', height: '12px' }} /> Close
            </button>
          </div>
          <div style={{ marginTop: '14px' }} className="g2">
            <div>
              <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>{selectedTask.title}</div>
              {selectedTask.description && <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>{selectedTask.description}</div>}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`tag ${selectedTask.status === 'completed' ? 'tag-green' : selectedTask.status === 'overdue' ? 'tag-red' : selectedTask.status === 'in_progress' ? 'tag-amber' : 'tag-blue'}`} style={{ textTransform: 'capitalize' }}>
                  {selectedTask.status?.replace('_', ' ')}
                </span>
                {selectedTask.priority !== 'normal' && (
                  <span className={`tag ${selectedTask.priority === 'critical' || selectedTask.priority === 'high' ? 'tag-red' : 'tag-amber'}`} style={{ textTransform: 'capitalize' }}>
                    {selectedTask.priority}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text3)', width: '80px' }}>Assigned to</span>
                  <span style={{ fontSize: '12px' }}>{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text3)', width: '80px' }}>Created</span>
                  <span style={{ fontSize: '12px' }}>{selectedTask.createdAt ? format(new Date(selectedTask.createdAt), 'MMM d, yyyy') : '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text3)', width: '80px' }}>Due date</span>
                  <span style={{ fontSize: '12px', color: selectedTask.status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>
                    {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text3)', width: '80px' }}>Source</span>
                  <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>{selectedTask.source || 'manual'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CalendarPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
  DismissRegular
} from '@fluentui/react-icons';

import { useEventContextStore } from '../store/eventContextStore';

export default function CalendarPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selected, setSelected] = useState(null);
  const { selectedEvent } = useEventContextStore();

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/tasks').then(r => r.data) });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) });

  const subEvents = events.filter(e => e.parentEvent === selectedEvent?.id || e.parentEvent?._id === selectedEvent?.id);
  const subEventsIds = subEvents.map(se => se._id);
  const scopedTasks = tasks.filter(t => subEventsIds.includes(t.event?._id || t.event));

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { const d = new Date(year, month - 1); setMonth(d.getMonth()); setYear(d.getFullYear()); };
  const nextMonth = () => { const d = new Date(year, month + 1); setMonth(d.getMonth()); setYear(d.getFullYear()); };

  const getItems = (d) => {
    const date = new Date(year, month, d).toDateString();
    return {
      events: subEvents.filter(e => e.startDate && new Date(e.startDate).toDateString() === date),
      tasks: scopedTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === date),
    };
  };

  const selectedItems = selected ? getItems(selected) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>{MONTHS[month]} {year}</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={prevMonth}>
            <ChevronLeftRegular style={{ width: '12px', height: '12px' }} /> Prev
          </button>
          <button className="btn btn-sm" onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}>Today</button>
          <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={nextMonth}>
            Next <ChevronRightRegular style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      </div>

      <div className="g2" style={{ alignItems: 'start' }}>
        {/* Calendar grid */}
        <div style={{ gridColumn: selected ? '1' : '1 / -1' }}>
          <div className="cal-grid">
            {DAYS.map(d => <div key={d} className="cal-hdr">{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="cal-cell" style={{ background: 'var(--surface2)' }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = d === selected;
              const { events: de, tasks: dt } = getItems(d);
              const hasItems = de.length > 0 || dt.length > 0;
              return (
                <div key={d} className="cal-cell"
                  style={{ cursor: hasItems ? 'pointer' : 'default', background: isSelected ? 'var(--blue-bg)' : '' }}
                  onClick={() => setSelected(d === selected ? null : d)}>
                  <div className={`cal-day${isToday ? ' today' : ''}`}>{d}</div>
                  {de.slice(0, 1).map(e => (
                    <div key={e._id} className="cal-evt" style={{ background: e.domain?.color || 'var(--blue)', color: '#fff' }}>
                      {e.name}
                    </div>
                  ))}
                  {dt.slice(0, 2).map(t => (
                    <div key={t._id} className="cal-evt" style={{ background: t.status === 'overdue' ? 'var(--red-bg)' : t.status === 'completed' ? 'var(--green-bg)' : 'var(--amber-bg)', color: t.status === 'overdue' ? 'var(--red)' : t.status === 'completed' ? 'var(--green)' : 'var(--amber)' }}>
                      {t.title}
                    </div>
                  ))}
                  {(de.length + dt.length) > 3 && (
                    <div style={{ fontSize: '10px', color: 'var(--text3)' }}>+{de.length + dt.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text3)' }}><span style={{ width: '10px', height: '10px', background: 'var(--blue)', borderRadius: '2px', display: 'inline-block' }} />Event</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text3)' }}><span style={{ width: '10px', height: '10px', background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: '2px', display: 'inline-block' }} />Task due</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text3)' }}><span style={{ width: '10px', height: '10px', background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '2px', display: 'inline-block' }} />Overdue</span>
          </div>
        </div>

        {/* Day detail panel */}
        {selected && selectedItems && (
          <div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontWeight: 500 }}>{MONTHS[month]} {selected}, {year}</div>
                <button className="btn btn-sm" onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DismissRegular style={{ width: '12px', height: '12px' }} />
                </button>
              </div>
              {selectedItems.events.length === 0 && selectedItems.tasks.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Nothing scheduled for this day.</div>
              ) : null}
              {selectedItems.events.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '8px' }}>Events</div>
                  {selectedItems.events.map(e => (
                    <div key={e._id} style={{ padding: '9px 11px', background: 'var(--blue-bg)', borderRadius: '7px', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--blue-t)' }}>{e.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--blue-t)', opacity: 0.8 }}>{e.venue || e.domain?.name}</div>
                    </div>
                  ))}
                </div>
              )}
              {selectedItems.tasks.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '8px' }}>Tasks due</div>
                  {selectedItems.tasks.map(t => (
                    <div key={t._id} style={{ padding: '9px 11px', background: t.status === 'overdue' ? 'var(--red-bg)' : 'var(--surface2)', borderRadius: '7px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: t.status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>{t.title}</div>
                        {t.assignedTo && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{t.assignedTo.name}</div>}
                      </div>
                      <span className={`tag ${t.status === 'completed' ? 'tag-green' : t.status === 'overdue' ? 'tag-red' : 'tag-amber'}`} style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                        {t.status?.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

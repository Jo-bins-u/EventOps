import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIStore } from '../store/aiStore';
import { 
  HomeRegular,
  ChatRegular,
  TaskListLtrRegular,
  CalendarRegular,
  TimelineRegular,
  DataTrendingRegular,
  FolderRegular,
  PersonRegular,
  WarningRegular,
  CalendarLtrRegular,
  SparkleRegular
} from '@fluentui/react-icons';

const staticItems = [
  // Navigation
  { type: 'nav', label: 'Go to Dashboard', path: '/', icon: <HomeRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  { type: 'nav', label: 'Go to Events', path: '/events', icon: <CalendarRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  { type: 'nav', label: 'Go to Chat', path: '/chat', icon: <ChatRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  { type: 'nav', label: 'Go to Tasks', path: '/tasks', icon: <TaskListLtrRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  { type: 'nav', label: 'Go to Calendar', path: '/calendar', icon: <CalendarRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  { type: 'nav', label: 'Go to Gantt Chart', path: '/gantt', icon: <TimelineRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  { type: 'nav', label: 'Go to Analytics', path: '/analytics', icon: <DataTrendingRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  { type: 'nav', label: 'Go to Documents', path: '/documents', icon: <FolderRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  { type: 'nav', label: 'Go to Profile', path: '/profile', icon: <PersonRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'Navigation' },
  
  // AI Commands
  { type: 'ai', label: 'Ask AI: "What are my tasks?"', prompt: 'What are my tasks?', icon: <TaskListLtrRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'AI Assistant' },
  { type: 'ai', label: 'Ask AI: "Do I have overdue tasks?"', prompt: 'Do I have any overdue tasks?', icon: <WarningRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'AI Assistant' },
  { type: 'ai', label: 'Ask AI: "List upcoming events"', prompt: 'What are the upcoming events?', icon: <CalendarLtrRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'AI Assistant' },
  { type: 'ai', label: 'Ask AI: "Give event and task summary"', prompt: 'Give me a quick summary of current events and tasks.', icon: <DataTrendingRegular style={{ width: '16.5px', height: '16.5px' }} />, category: 'AI Assistant' },
];

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, sendMessage, setIsOpen } = useAIStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setCommandPaletteOpen(false);
      }
    }
    if (commandPaletteOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  // Filter items based on search query
  const searchLower = search.toLowerCase();
  
  // Custom item for sending the literal typed text to AI
  const customAIItem = search.trim() ? [
    {
      type: 'ai',
      label: `Ask AI: "${search}"`,
      prompt: search,
      icon: <SparkleRegular style={{ width: '16.5px', height: '16.5px' }} />,
      category: 'AI Assistant'
    }
  ] : [];

  const filteredStatic = staticItems.filter(item => 
    item.label.toLowerCase().includes(searchLower) ||
    (item.prompt && item.prompt.toLowerCase().includes(searchLower))
  );

  const items = [...customAIItem, ...filteredStatic];

  // Adjust selection bounds
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        handleSelect(items[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  const handleSelect = (item) => {
    setCommandPaletteOpen(false);
    if (item.type === 'nav') {
      navigate(item.path);
    } else if (item.type === 'ai') {
      sendMessage(item.prompt);
      setIsOpen(true);
    }
  };

  // Group items by category for nice visual separation
  const categories = {};
  items.forEach((item, index) => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push({ ...item, originalIndex: index });
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '12vh',
    }}>
      <div
        ref={modalRef}
        onKeyDown={handleKeyDown}
        style={{
          width: '580px',
          maxWidth: '92vw',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(25px) saturate(190%)',
          WebkitBackdropFilter: 'blur(25px) saturate(190%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Search bar row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <span style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
            <SparkleRegular style={{ width: '18px', height: '18px' }} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or ask the assistant anything..."
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              color: 'var(--text)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              padding: 0,
            }}
          />
          <span style={{
            fontSize: '10px',
            color: 'var(--text3)',
            background: 'var(--surface2)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            fontWeight: 600,
          }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{
          maxHeight: '380px',
          overflowY: 'auto',
          padding: '12px 8px',
        }}>
          {items.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text3)',
              fontSize: '13px',
            }}>
              No matching pages or commands found. Press Enter to ask AI instead.
            </div>
          ) : (
            Object.keys(categories).map((catName) => (
              <div key={catName}>
                <div style={{
                  padding: '8px 12px 4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text3)',
                  letterSpacing: '0.05em',
                }}>
                  {catName}
                </div>
                {categories[catName].map((item) => {
                  const isSelected = item.originalIndex === selectedIndex;
                  return (
                    <div
                      key={item.originalIndex}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(item.originalIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%)' : 'transparent',
                        boxShadow: isSelected ? 'inset 0 0 0 1px rgba(5, 150, 105, 0.2)' : 'none',
                        transition: 'background 0.15s ease, transform 0.1s ease',
                        transform: isSelected ? 'translateX(3px)' : 'none',
                      }}
                    >
                      <span style={{
                        fontSize: '16px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: isSelected ? 'var(--blue-bg)' : 'var(--surface2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? 'var(--blue-t)' : 'var(--text2)',
                        transition: 'all 0.15s',
                      }}>
                        {item.icon}
                      </span>
                      <span style={{
                        fontSize: '12.5px',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? 'var(--text)' : 'var(--text2)',
                        flex: 1,
                      }}>
                        {item.label}
                      </span>
                      {isSelected && (
                        <span style={{
                          fontSize: '10px',
                          color: 'var(--blue-t)',
                          fontWeight: 600,
                        }}>
                          ↵ Enter
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--glass-border)',
          background: 'rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text3)',
        }}>
          <div>
            Use <span style={{ fontWeight: 600 }}>↑↓</span> to navigate, <span style={{ fontWeight: 600 }}>Enter</span> to select
          </div>
          <div>
            Search or ask AI coordinator
          </div>
        </div>
      </div>
    </div>
  );
}

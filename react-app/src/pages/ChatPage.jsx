import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/authStore';
import { analyzeMessage } from '../utils/nlp';

export default function ChatPage() {
  const { user } = useAuthStore();
  const { emit, on, off, joinRoom, leaveRoom } = useSocket();
  const qc = useQueryClient();

  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState([]);
  const [nlpResult, setNlpResult] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Fetch chat rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => api.get('/chat/rooms').then(r => r.data),
  });

  // Fetch messages for active room
  const { data: history = [] } = useQuery({
    queryKey: ['chat-messages', activeRoom?._id],
    queryFn: () => api.get(`/chat/rooms/${activeRoom._id}/messages`).then(r => r.data),
    enabled: !!activeRoom,
  });

  useEffect(() => {
    if (history) {
      setMessages(history);
    }
  }, [history]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content) => api.post(`/chat/rooms/${activeRoom._id}/messages`, { content }),
    onSuccess: () => setInput(''),
    onError: () => toast.error('Failed to send message'),
  });

  // Convert to task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data) => api.post('/tasks', data),
    onSuccess: () => toast.success('Task created!'),
  });

  useEffect(() => {
    if (!activeRoom) return;
    joinRoom(activeRoom._id);

    on('chat:message', (msg) => {
      if (msg.room === activeRoom._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    on('chat:typing', ({ userName, isTyping }) => {
      setTyping((prev) =>
        isTyping ? [...new Set([...prev, userName])] : prev.filter(n => n !== userName)
      );
    });

    return () => {
      leaveRoom(activeRoom._id);
      off('chat:message');
      off('chat:typing');
    };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // NLP analysis on the fly
    if (e.target.value.length > 10) {
      const result = analyzeMessage(e.target.value);
      setNlpResult(result.isActionable ? result : null);
    } else {
      setNlpResult(null);
    }
    // Typing indicator
    emit('chat:typing', { roomId: activeRoom?._id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emit('chat:typing', { roomId: activeRoom?._id, isTyping: false });
    }, 1500);
  };

  const handleSend = () => {
    if (!input.trim() || !activeRoom) return;
    sendMutation.mutate(input.trim());
    emit('chat:message', { roomId: activeRoom._id, content: input.trim() });
  };

  const handleConvert = (suggestion, message) => {
    if (suggestion.type === 'task') {
      createTaskMutation.mutate({
        title: message.content.slice(0, 80),
        sourceMessageId: message._id,
        sourceRoomId: activeRoom._id,
      });
    } else if (suggestion.type === 'calendar') {
      toast.success('Opening calendar event creator...');
    } else if (suggestion.type === 'reminder') {
      toast.success('Reminder set!');
    }
  };

  const handlePin = async (messageId) => {
    await api.patch(`/chat/messages/${messageId}/pin`);
    toast.success('Message pinned');
  };

  const handleStar = async (messageId) => {
    await api.patch(`/chat/messages/${messageId}/star`);
  };

  return (
    <div className="card" style={{ display: 'flex', height: 'calc(100vh - 106px)', gap: 0, padding: 0, overflow: 'hidden', zIndex: 1 }}>
      {/* Room list */}
      <div style={{
        width: '240px',
        flexShrink: 0,
        borderRight: '1px solid var(--glass-border)',
        background: 'rgba(255, 255, 255, 0.01)',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ padding: '16px 14px 8px', fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Channels</div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '10px' }}>
          {rooms.map((room) => {
            const isActive = activeRoom?._id === room._id;
            return (
              <div
                key={room._id}
                onClick={() => setActiveRoom(room)}
                className="chat-room-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  margin: '4px 10px',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  background: isActive ? 'var(--blue-bg)' : 'transparent',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(59, 130, 246, 0.15)' : 'none',
                  color: isActive ? 'var(--blue-t)' : 'var(--text2)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'var(--transition-all)',
                }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: room.color || 'var(--blue)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{room.memberCount} members</div>
                </div>
                {room.unreadCount > 0 && (
                  <span style={{ background: 'var(--red)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    {room.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      {activeRoom ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0, 0, 0, 0.015)' }}>
          {/* Header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(10px)',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{activeRoom.name}</div>
              <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>{activeRoom.memberCount} members</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm" onClick={() => toast('Showing pinned messages...')} style={{ borderRadius: 'var(--radius)' }}>📌 Pinned</button>
              <button className="btn btn-sm" onClick={() => toast('Opening files...')} style={{ borderRadius: 'var(--radius)' }}>📁 Files</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {messages.map((msg) => {
              const analysis = analyzeMessage(msg.content);
              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  currentUser={user}
                  analysis={analysis}
                  onConvert={(s) => handleConvert(s, msg)}
                  onPin={() => handlePin(msg._id)}
                  onStar={() => handleStar(msg._id)}
                />
              );
            })}
            {typing.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic', paddingLeft: '8px' }}>
                {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* NLP hint */}
          {nlpResult && (
            <div style={{
              padding: '10px 20px',
              background: 'var(--amber-bg)',
              borderTop: '1px solid var(--glass-border)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--amber-t)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>🧠 Suggestion:</span>
              {nlpResult.suggestions.map((s) => (
                <button key={s.type} className="btn btn-sm" style={{ background: 'var(--amber-bg)', color: 'var(--amber-t)', borderColor: 'var(--amber)' }}
                  onClick={() => toast.success(`${s.label}: ${s.description}`)}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            alignItems: 'center',
          }}>
            <button className="btn btn-sm" title="Attach file" style={{ padding: '8px 12px', borderRadius: 'var(--radius)' }}>📎</button>
            <input
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Message ${activeRoom.name}...`}
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: '13px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border2)',
                background: 'var(--surface2)',
                outline: 'none',
                transition: 'var(--transition-all)'
              }}
            />
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={sendMutation.isPending}
              style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)' }}
            >
              {sendMutation.isPending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-heading)' }}>
          Select a channel to start chatting
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, currentUser, analysis, onConvert, onPin, onStar }) {
  const isAdmin = message.sender?.role === 'admin';
  const initials = message.sender?.name?.slice(0, 2).toUpperCase() || '??';
  const isSelf = message.sender?._id === currentUser?._id;

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      flexDirection: isSelf ? 'row-reverse' : 'row',
      alignSelf: isSelf ? 'flex-end' : 'flex-start',
      maxWidth: '75%',
    }}>
      <div className="av av-blue" style={{ width: '34px', height: '34px', fontSize: '12px', flexShrink: 0, borderRadius: 'var(--radius-full)' }}>
        {initials}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px', flexDirection: isSelf ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: isAdmin ? 'var(--blue-t)' : 'var(--text)' }}>
            {message.sender?.name}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 500 }}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isAdmin && <span className="tag tag-blue" style={{ fontSize: '9px', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>Admin</span>}
          {message.pinned && <span style={{ fontSize: '11px' }}>📌</span>}
          {message.starred && <span style={{ fontSize: '11px' }}>⭐</span>}
        </div>
        <div style={{
          fontSize: '13px',
          lineHeight: '1.55',
          background: isSelf
            ? 'linear-gradient(135deg, var(--blue) 0%, #2563eb 100%)'
            : (isAdmin ? 'var(--blue-bg)' : 'var(--surface2)'),
          border: isSelf
            ? '1px solid transparent'
            : (isAdmin ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid var(--border)'),
          color: isSelf ? '#fff' : 'var(--text)',
          padding: '10px 16px',
          borderRadius: isSelf ? '16px 0 16px 16px' : '0 16px 16px 16px',
          display: 'inline-block',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          wordBreak: 'break-word',
        }}>
          {message.content}
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', justifyContent: isSelf ? 'flex-end' : 'flex-start' }}>
          {analysis.isActionable && analysis.suggestions.map((s) => (
            <button key={s.type} className="btn btn-sm" onClick={() => onConvert(s)} style={{ borderRadius: 'var(--radius)', fontSize: '10px', padding: '3px 8px' }}>
              {s.icon} {s.label}
            </button>
          ))}
          <button className="btn btn-sm" onClick={onPin} title="Pin message" style={{ borderRadius: 'var(--radius)', padding: '3px 8px' }}>📌</button>
          <button className="btn btn-sm" onClick={onStar} title="Star message" style={{ borderRadius: 'var(--radius)', padding: '3px 8px' }}>⭐</button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useAIStore } from '../store/aiStore';
import {
  WarningRegular,
  TaskListLtrRegular,
  CalendarLtrRegular,
  DataTrendingRegular,
  SparkleRegular,
  HistoryRegular,
  DismissRegular,
  BotRegular,
  PersonRegular,
  LinkRegular,
  ChatRegular
} from '@fluentui/react-icons';

export default function AIAssistant() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const {
    isOpen,
    setIsOpen,
    messages,
    loading,
    completedActions,
    setCompletedAction,
    fetchHistory,
    sendMessage,
    clearHistory
  } = useAIStore();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history from backend on mount/open
  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!inputRef.current) return;
    const text = inputRef.current.value.trim();
    if (!text) return;
    sendMessage(text);
    inputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const executeAction = async (action, actionIndex, messageId) => {
    const actionKey = `${messageId}-${actionIndex}`;
    if (completedActions[actionKey]) return;

    if (action.type === 'create_task') {
      try {
        await api.post('/tasks', {
          title: action.title,
          dueDate: action.dueDate,
          priority: action.priority || 'normal',
          event: action.eventId, // mapping eventId to event field
        });
        setCompletedAction(actionKey, 'created');
        toast.success(`Task created: "${action.title}"`);
      } catch (err) {
        console.error('Failed to create task from AI suggestion:', err);
        toast.error(err.response?.data?.message || 'Failed to create task. Check if the event exists.');
      }
    } else if (action.type === 'navigate') {
      navigate(action.path);
      setCompletedAction(actionKey, 'navigated');
      toast.success(`Navigating to ${action.path}`);
      // In docked mode, we might choose to keep the panel open so the user can continue their workflow.
    } else if (action.type === 'send_message') {
      try {
        await api.post(`/chat/rooms/${action.roomId}/messages`, {
          content: action.content,
          type: 'text'
        });
        setCompletedAction(actionKey, 'sent');
        toast.success(`Message sent to chat room!`);
      } catch (err) {
        console.error('Failed to send chat message from AI suggestion:', err);
        toast.error(err.response?.data?.message || 'Failed to send message.');
      }
    }
  };

  const quickActions = [
    { label: 'My Tasks', icon: <TaskListLtrRegular style={{ width: '14px', height: '14px', marginRight: '6px' }} />, prompt: 'What are my tasks?' },
    { label: 'Overdue Tasks', icon: <WarningRegular style={{ width: '14px', height: '14px', marginRight: '6px', color: 'var(--red)' }} />, prompt: 'Do I have any overdue tasks?' },
    { label: 'Upcoming Events', icon: <CalendarLtrRegular style={{ width: '14px', height: '14px', marginRight: '6px' }} />, prompt: 'What are the upcoming events?' },
    { label: 'Event Summary', icon: <DataTrendingRegular style={{ width: '14px', height: '14px', marginRight: '6px' }} />, prompt: 'Give me a quick summary of current events and tasks.' },
  ];

  return (
    <aside
      style={{
        width: isOpen ? '380px' : '0',
        flexShrink: 0,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderLeft: isOpen ? '1px solid var(--glass-border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s',
        color: 'var(--text)',
        zIndex: 10,
        boxShadow: isOpen ? '-10px 0 30px var(--glass-shadow)' : 'none',
      }}
    >
      {/* Inner fixed-width container prevents squishing during animations */}
      <div style={{ width: '380px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text)' }}>
              <SparkleRegular style={{ width: '18px', height: '18px' }} />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-heading)' }}>EventOps AI</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 500 }}>Context-Aware Intelligent Assistant</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {messages.length > 0 && (
              <button
                className="btn btn-sm btn-danger"
                onClick={clearHistory}
                style={{ padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                title="Clear Chat"
              >
                <HistoryRegular style={{ width: '14px', height: '14px' }} />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text3)',
                padding: '4px',
                transition: 'var(--transition-all)',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
              title="Hide Assistant"
            >
              <DismissRegular style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(0, 0, 0, 0.015)',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '20px',
                color: 'var(--text2)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--blue-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.2)',
                  color: 'var(--blue-t)'
                }}
              >
                <BotRegular style={{ width: '32px', height: '32px' }} />
              </div>
              <h4 style={{ marginBottom: '8px', fontWeight: 600 }}>Welcome to EventOps AI</h4>
              <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.5', maxWidth: '260px' }}>
                Hi {user?.name || 'there'}! I am connected to the platform database. Ask me about your domains, events, upcoming tasks, or requests to create a task!
              </p>

              {/* Quick actions on empty state */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '100%',
                  marginTop: '24px',
                  maxWidth: '280px',
                }}
              >
                {quickActions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => sendMessage(qa.prompt)}
                    className="btn btn-sm"
                    style={{
                      justifyContent: 'flex-start',
                      width: '100%',
                      background: 'var(--surface2)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {qa.icon}
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isAI = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isAI ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    animation: 'fadeInUp 0.3s ease-out both',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      marginBottom: '4px',
                      flexDirection: isAI ? 'row' : 'row-reverse',
                      fontSize: '11px',
                      color: 'var(--text3)',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {isAI ? (
                        <>
                          <BotRegular style={{ width: '12px', height: '12px' }} /> AI Assistant
                        </>
                      ) : (
                        <>
                          <PersonRegular style={{ width: '12px', height: '12px' }} /> You
                        </>
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isAI ? '0 16px 16px 16px' : '16px 0 16px 16px',
                      background: isAI ? 'var(--surface2)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: isAI ? '1px solid var(--border)' : '1px solid transparent',
                      color: isAI ? 'var(--text)' : '#fff',
                      fontSize: '12.5px',
                      lineHeight: '1.5',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {isAI ? renderFormattedText(msg.text) : msg.text}
                  </div>

                  {/* Render Actions for AI response */}
                  {isAI && msg.actions && msg.actions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {msg.actions.map((act, idx) => {
                        const actKey = `${msg.id}-${idx}`;
                        const status = completedActions[actKey];

                        return (
                          <div
                            key={idx}
                            style={{
                              background: 'var(--surface3)',
                              border: '1px solid var(--border2)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '11.5px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: 'var(--blue-t)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                 {act.type === 'create_task' ? (
                                   <>
                                     <TaskListLtrRegular style={{ width: '14px', height: '14px' }} /> Suggested Task
                                   </>
                                 ) : act.type === 'send_message' ? (
                                   <>
                                     <ChatRegular style={{ width: '14px', height: '14px' }} /> Suggested Chat Message
                                   </>
                                 ) : (
                                   <>
                                     <LinkRegular style={{ width: '14px', height: '14px' }} /> Navigation Link
                                   </>
                                 )}
                              </span>
                              {status && (
                                <span style={{ fontSize: '10px', color: 'var(--green-t)', fontWeight: 600 }}>
                                  {status === 'created' ? '✓ Created' : status === 'sent' ? '✓ Sent' : '✓ Navigated'}
                                </span>
                              )}
                            </div>

                            {act.type === 'create_task' ? (
                              <div>
                                <div style={{ fontWeight: 600 }}>{act.title}</div>
                                {act.dueDate && (
                                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                                    Due: {new Date(act.dueDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : act.type === 'send_message' ? (
                              <div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>Drafted message:</div>
                                <div style={{ fontSize: '11.5px', fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid var(--blue)' }}>
                                  "{act.content}"
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Go to: {act.path}</div>
                            )}

                            {!status && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => executeAction(act, idx, msg.id)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '10.5px',
                                  justifyContent: 'center',
                                  width: '100%',
                                }}
                              >
                                {act.type === 'create_task' ? 'Create Task' : act.type === 'send_message' ? 'Send Message' : 'Go to Page'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start', alignItems: 'center', paddingLeft: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>AI is thinking</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--text3)',
                    animation: 'fadeInUp 0.6s infinite alternate',
                  }}
                />
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--text3)',
                    animation: 'fadeInUp 0.6s infinite alternate 0.2s',
                  }}
                />
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--text3)',
                    animation: 'fadeInUp 0.6s infinite alternate 0.4s',
                  }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions (Small footer row, visible when chat has history) */}
        {messages.length > 0 && !loading && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '6px 12px',
              overflowX: 'auto',
              borderTop: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.015)',
              whiteSpace: 'nowrap',
            }}
          >
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => sendMessage(qa.prompt)}
                className="btn btn-sm"
                style={{
                  fontSize: '10px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'var(--surface)',
                  flexShrink: 0,
                }}
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <div
          style={{
            padding: '12px 16px 18px',
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask EventOps AI..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border2)',
              fontSize: '12px',
              outline: 'none',
              background: 'var(--surface2)',
              color: 'var(--text)',
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSend}
            disabled={loading}
            style={{
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}

// --- Markdown Parsing Helpers ---
const renderFormattedText = (text) => {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  return lines.map((line, idx) => {
    let content = line;
    
    // Parse Headers
    if (content.startsWith('### ')) {
      return (
        <h5 key={idx} style={{ margin: '8px 0 4px 0', fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
          {parseInlineFormatting(content.slice(4))}
        </h5>
      );
    }
    if (content.startsWith('## ')) {
      return (
        <h4 key={idx} style={{ margin: '10px 0 6px 0', fontWeight: 700, fontSize: '14px', color: 'var(--text)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '3px' }}>
          {parseInlineFormatting(content.slice(3))}
        </h4>
      );
    }
    if (content.startsWith('# ')) {
      return (
        <h3 key={idx} style={{ margin: '12px 0 8px 0', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
          {parseInlineFormatting(content.slice(2))}
        </h3>
      );
    }
    
    // Parse bullet points
    if (content.trim().startsWith('- ') || content.trim().startsWith('* ')) {
      const isIndented = line.startsWith('  ') || line.startsWith('\t');
      return (
        <div key={idx} style={{ display: 'flex', gap: '6px', paddingLeft: isIndented ? '16px' : '8px', margin: '3px 0', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--blue-t)', fontWeight: 'bold' }}>•</span>
          <span style={{ flex: 1 }}>{parseInlineFormatting(content.trim().slice(2))}</span>
        </div>
      );
    }
    
    // Default line
    return (
      <span key={idx} style={{ display: 'block', margin: '4px 0', minHeight: content.trim() === '' ? '8px' : '0' }}>
        {parseInlineFormatting(content)}
      </span>
    );
  });
};

const parseInlineFormatting = (text) => {
  if (!text) return '';
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const matches = text.split(regex);
  
  return matches.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{ 
          background: 'var(--surface3)', 
          padding: '2px 5px', 
          borderRadius: '4px', 
          fontSize: '11px',
          fontFamily: 'monospace',
          border: '1px solid var(--border)' 
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

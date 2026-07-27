import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotifStore } from '../store/notifStore';

let socket = null;

export function useSocket() {
  const { token, user } = useAuthStore();
  const { addNotification } = useNotifStore();
  const handlersRef = useRef({});

  useEffect(() => {
    if (!token || socket) return;

    socket = io(process.env.REACT_APP_WS_URL || undefined, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('WS connected:', socket.id));
    socket.on('disconnect', () => console.log('WS disconnected'));

    // Global notification handler
    socket.on('notification', (notif) => {
      addNotification(notif);
    });

    // Task updates
    socket.on('task:updated', (task) => {
      handlersRef.current['task:updated']?.(task);
    });

    // Chat messages
    socket.on('chat:message', (msg) => {
      handlersRef.current['chat:message']?.(msg);
    });

    // Typing indicators
    socket.on('chat:typing', (data) => {
      handlersRef.current['chat:typing']?.(data);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token]);

  const on = (event, handler) => {
    handlersRef.current[event] = handler;
  };

  const off = (event) => {
    delete handlersRef.current[event];
  };

  const emit = (event, data) => {
    socket?.emit(event, data);
  };

  const joinRoom = (roomId) => socket?.emit('join:room', roomId);
  const leaveRoom = (roomId) => socket?.emit('leave:room', roomId);

  return { socket, emit, on, off, joinRoom, leaveRoom };
}

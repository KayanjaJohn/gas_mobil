import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Agent socket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Agent socket disconnected');
      setConnected(false);
    });

    socket.on('new_order', (data) => {
      setNotifications(prev => [data, ...prev]);
    });

    socket.on('driver_status_change', (data) => {
      console.log('Driver status changed:', data);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    connected,
    notifications,
    clearNotifications,
    connect,
    disconnect,
  };
}

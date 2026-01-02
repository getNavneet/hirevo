import { useState, useEffect } from 'react';
import { 
  connectSocket, 
  disconnectSocket, 
  onSocketEvent,
  offSocketEvent,
  setupBackendStateTracking 
} from '../../../lib/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const socketInstance = connectSocket('http://localhost:8001');
    setSocket(socketInstance);
    setupBackendStateTracking();
    
    onSocketEvent('connect', () => {
      setIsConnected(true);
      setError('');
    });

    onSocketEvent('disconnect', () => {
      setIsConnected(false);
    });

    onSocketEvent('error', (data) => {
      setError(data.message);
    });

    socketInstance.connect();

    return () => {
      offSocketEvent('connect');
      offSocketEvent('disconnect');
      offSocketEvent('error');
      disconnectSocket();
    };
  }, []);

  return { socket, isConnected, error, setError };
};
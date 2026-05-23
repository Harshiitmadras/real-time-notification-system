import { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_URL = '/api/notifications';
const WS_URL = '/ws';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'MESSAGE' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchInitialData = useCallback(async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        fetch(`${API_URL}?size=50`, { headers: { 'X-User-Id': userId } }),
        fetch(`${API_URL}/unread-count`, { headers: { 'X-User-Id': userId } })
      ]);
      const notifsData = await notifsRes.json();
      const countData = await countRes.json();
      
      setNotifications(notifsData.content || []);
      setUnreadCount(countData);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchInitialData();

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('Connected to WebSocket');
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          const newNotification: Notification = JSON.parse(message.body);
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [userId, fetchInitialData]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/${id}/read`, {
        method: 'PUT',
        headers: { 'X-User-Id': userId }
      });
      setNotifications((prev) => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return { notifications, unreadCount, markAsRead };
}

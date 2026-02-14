// frontend/contexts/useWebSocket.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addMessage } from '@/store/slices/message/conversationSlice';
import { supabase } from '@/utils/supabase';
import { BackendMessage } from '@/types/backend/message';
import { addMessage as addClassroomMessage } from '@/store/slices/classroom/classroomSlice';
import { ClassroomBackendMessage } from '@/types/backend/classroomMessage';

interface WebSocketMessage {
  type: 'new_message' | 'user_joined' | 'user_left' | 'typing' | 'error';
  data?: BackendMessage | ClassroomBackendMessage;
  user_id?: string;
  timestamp?: string;
  message?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendTypingIndicator: () => void;
  reconnect: () => void;
}

export default function useWebSocket(mode: 'conversation' | 'classroom' = 'conversation'): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef<number>(0);
  // const isConnectedRef = useRef<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);

  const dispatch = useDispatch();

  const chatId = useSelector((state: RootState) =>
    mode === 'classroom'
      ? state.classroom.selectedClassroomId
      : state.conversation.selectedChatId
  );

  console.log(`useWebSocket - mode: ${mode}, chatId: ${chatId}`);

  const myUserId = useSelector((state: RootState) => state.profile.userId);

  console.log("useWebSocket - myUserId:", myUserId);

  const MAX_RECONNECT_ATTEMPTS = 2;
  const RECONNECT_DELAY = 3000; // 3 seconds

  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session.access_token;
  };

  const connect = useCallback(async () => {
    // Skip if no chat selected or already connected
    if (!chatId || !myUserId) {
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No auth token for WebSocket');
        return;
      }

      const wsUrl = `${process.env.EXPO_PUBLIC_WS_URL}/ws/chat/${chatId}?token=${token}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected to chat:', chatId);
        // isConnectedRef.current = true;
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📥 WebSocket message received:', message.type);

          switch (message.type) {
            case 'new_message':
              if (message.data) {
                console.log('💬 New message from:', message.data.sender_id);
                // Only add if it's not from us (we already have it from send API)

                if (message.data.chat_id !== chatId) {
                  console.warn('⚠️ Received message for different chat:', message.data.chat_id);
                  break;
                }

                if (message.data.sender_id !== myUserId) {
                  if (mode === 'classroom') {

                    dispatch(addClassroomMessage({
                      chat_id: message.data.chat_id,
                      message: message.data as ClassroomBackendMessage 
                    }));
                  } else {
                    dispatch(addMessage({
                      chat_id: message.data.chat_id,
                      message: message.data as BackendMessage
                    }));
                  }
                }
              }
              break;

            case 'user_joined':
              console.log('👋 User joined:', message.user_id);
              // Optional: Update UI to show user online
              break;

            case 'user_left':
              console.log('👋 User left:', message.user_id);
              // Optional: Update UI to show user offline
              break;

            case 'typing':
              console.log('✍️  User typing:', message.user_id);
              // Optional: Show typing indicator
              break;

            case 'error':
              console.error('❌ WebSocket error:', message.message);
              break;

            default:
              console.log('❓ Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        // isConnectedRef.current = false;
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        // isConnectedRef.current = false;
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

          if (chatId) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, RECONNECT_DELAY);
          }
          
        } else {
          console.error('❌ Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      // isConnectedRef.current = false;
      setIsConnected(false);
    }
  }, [chatId, myUserId, dispatch]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      console.log('🔌 Closing WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
      // isConnectedRef.current = false;
      setIsConnected(false);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  const sendTypingIndicator = useCallback(() => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }));
    }
  }, [isConnected]);

  // Connect when chat changes
  useEffect(() => {
    if (chatId && myUserId) {
      connect();
    }

    // Cleanup on unmount or chat change
    return () => {
      disconnect();
    };
  }, [chatId, myUserId, connect, disconnect]);

  return {
    isConnected: isConnected,
    sendTypingIndicator,
    reconnect,
  };
}
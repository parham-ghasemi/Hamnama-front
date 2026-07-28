// contexts/RoomContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

// Define the payload structures matching your Go backend
export interface Message {
  id: string;
  senderId: number;
  senderName: string;
  pfp: string;
  text: string;
  time: string;
}

export interface RoomUser {
  id: number;
  pfp: string;
  name: string;
  connectionStatus: "good" | "medium" | "bad";
  isRoomAdmin: boolean;
}

interface RoomContextType {
  users: RoomUser[];
  messages: Message[];
  mediaLink: string;
  currentQuality: string;
  sendMessage: (text: string) => void;
  updateMedia: (link: string, quality: string) => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

export const RoomProvider = ({ roomId, currentUserId, children }: { roomId: string, currentUserId: number, children: React.ReactNode }) => {
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mediaLink, setMediaLink] = useState("");
  const [currentQuality, setCurrentQuality] = useState("1080");

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to your Go WebSocket endpoint
    const socket = new WebSocket(`${import.meta.env.VITE_WS_URL}/rooms/${roomId}/ws?userId=${currentUserId}`);
    ws.current = socket;

    socket.onopen = () => console.log(`Connected to room ${roomId}`);

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      // Handle standard event routing based on your Go WS implementation
      switch (payload.type) {
        case 'ROOM_STATE':
          setUsers(payload.data.users);
          setMediaLink(payload.data.mediaLink);
          break;
        case 'USER_JOINED':
          setUsers(prev => [...prev, payload.data.user]);
          break;
        case 'USER_LEFT':
          setUsers(prev => prev.filter(u => u.id !== payload.data.userId));
          break;
        case 'CHAT_MESSAGE':
          setMessages(prev => [...prev, payload.data.message]);
          break;
        case 'MEDIA_UPDATED':
          setMediaLink(payload.data.link);
          setCurrentQuality(payload.data.quality);
          break;
        default:
          console.warn("Unknown WS event:", payload.type);
      }
    };

    return () => {
      socket.close();
    };
  }, [roomId, currentUserId]);

  // Expose functions to send data back to the server
  const sendMessage = (text: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'CHAT_MESSAGE', data: { text } }));
    }
  };

  const updateMedia = (link: string, quality: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'MEDIA_UPDATE', data: { link, quality } }));
    }
  };

  return (
    <RoomContext.Provider value={{ users, messages, mediaLink, currentQuality, sendMessage, updateMedia }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error("useRoom must be used within a RoomProvider");
  return context;
};
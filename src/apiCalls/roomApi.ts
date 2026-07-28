import api from "../lib/axiosConfig";

export type ConnectionStatus = "good" | "medium" | "bad" | "offline";

export interface RoomMemberResponse {
  user_id: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface RoomMessageResponse {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  content: string;
  created_at: string;
}

export interface RoomResponse {
  id: string;
  code: number;
  created_by: string;
  created_by_name: string;
  created_by_avatar: string;
  currently_playing?: string | null;
  playback_time: number;
  is_public: boolean;
  media_control_permission: "admin" | "everyone";
  created_at: string;
  members: RoomMemberResponse[];
  messages: RoomMessageResponse[];
}

export async function getRoom(roomId: string) {
  const { data } = await api.get<RoomResponse>(`/rooms/${roomId}`);
  return data;
}

export async function sendRoomMessage(roomId: string, content: string) {
  const { data } = await api.post<RoomMessageResponse>(`/rooms/${roomId}/messages`, {
    content,
  });
  return data;
}

export async function leaveRoom(roomId: string) {
  await api.post(`/rooms/${roomId}/leave`);
}
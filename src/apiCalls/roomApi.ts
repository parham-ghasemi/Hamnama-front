import api from "../lib/axiosConfig";
import axios from "axios";

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
  replying_to: string;
  replying_to_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  edited: boolean;
}

export interface CreateRoomRequest {
  is_public: boolean;
  media_control_permission: "admin" | "everyone";
}

export interface CreateRoomResponse {
  id: string;
  code: number;
}

export interface JoinRoomResponse {
  id: string;
}

export interface RoomReactionResponse {
  user_id: string;
  emoji: string;
}

export interface RoomAnnouncement {
  id: string;
  type: "room";
  message: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomAnnouncementsResponse {
  announcements: RoomAnnouncement[];
}

export interface RoomSocketUserPresence {
  user_id: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface RoomResponse {
  id: string;
  code: number;
  created_by: string;
  created_by_name: string;
  created_by_avatar: string;
  currently_playing?: string | null;
  playback_time: number;
  is_playing: boolean;
  is_public: boolean;
  media_control_permission: "admin" | "everyone";
  created_at: string;
  members: RoomMemberResponse[];
  messages: RoomMessageResponse[];
}

export async function createRoom(request: CreateRoomRequest) {
  const { data } = await api.post<CreateRoomResponse>(`/rooms`, request);
  return data;
}

export async function joinRoom(code: number) {
  const { data } = await api.post<JoinRoomResponse>(`/rooms/join`, { code });
  return data;
}

export async function getRoomAnnouncements() {
  const { data } = await api.get<RoomAnnouncementsResponse>('/announcements/room');
  return data;
}

export async function getCurrentRoom() {
  const { data } = await api.get<RoomResponse>(`/rooms/current`);
  return data;
}

export async function getLastActiveRoom() {
  const { data } = await api.get<RoomResponse>(`/rooms/last-active`);
  return data;
}

export async function getRoom(roomId: string) {
  const { data } = await api.get<RoomResponse>(`/rooms/${roomId}`);
  return data;
}

export async function editRoomMessage(roomId: string, messageId: string, content: string) {
  const { data } = await api.patch<RoomMessageResponse>(`/rooms/${roomId}/messages/${messageId}`, {
    content,
  });
  return data;
}

export async function sendRoomMessage(roomId: string, content: string, replyingTo?: string) {
  const { data } = await api.post<RoomMessageResponse>(`/rooms/${roomId}/messages`, {
    content,
    replying_to: replyingTo || null,
  });
  return data;
}

export async function leaveRoom(roomId: string) {
  await api.post(`/rooms/${roomId}/leave`);
}

export async function clearRoomData(roomId: string) {
  await api.delete(`/rooms/${roomId}`);
}

export async function updateRoomMemberRole(
  roomId: string,
  userId: string,
  role: "admin" | "member",
) {
  await api.patch(`/rooms/${roomId}/members/${userId}/role`, { role });
}

export async function kickRoomMember(roomId: string, userId: string) {
  await api.delete(`/rooms/${roomId}/members/${userId}`);
}


export function getRoomApiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

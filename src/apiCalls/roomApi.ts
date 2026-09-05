import api from "../lib/axiosConfig";
import axios from "axios";

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  filename: string;
  cues: SubtitleCue[];
}

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
  is_admin_sender?: boolean;
}

export interface CreateRoomRequest {
  name: string;
  is_public: boolean;
  media_control_permission: "admin" | "everyone";
}

export interface CreateRoomResponse {
  id: string;
  code: number;
}

export interface PublicRoomResponse {
  id: string;
  code: number;
  name: string;
  image?: string;
  created_at: string;
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

export interface RoomArchiveMediaState {
  id: string;
  title: string;
  type: "movie" | "series";
  url: string;
  quality?: string;
  softsub?: boolean;
  season?: number;
  episode?: number;
  next_episode?: RoomArchiveMediaState | null;
}

export interface RoomResponse {
  id: string;
  code: number;
  created_by: string;
  created_by_name: string;
  created_by_avatar: string;
  name: string;
  image?: string;
  currently_playing?: string | null;
  currently_playing_media?: RoomArchiveMediaState | null;
  currently_playing_subtitles?: string | null;
  playback_time: number;
  is_playing: boolean;
  is_public: boolean;
  media_control_permission: "admin" | "everyone";
  created_at: string;
  members: RoomMemberResponse[];
  messages: RoomMessageResponse[];
  subtitles?: SubtitleTrack[];
}

export async function createRoom(request: CreateRoomRequest) {
  const { data } = await api.post<CreateRoomResponse>(`/rooms`, request);
  return data;
}

export async function listPublicRooms() {
  const { data } = await api.get<{ rooms: PublicRoomResponse[] }>(`/rooms/public`);
  return data.rooms ?? [];
}

export async function updateRoomSettings(
  roomId: string,
  request: { name: string; is_public: boolean; media_control_permission: "admin" | "everyone" },
) {
  const { data } = await api.patch<RoomResponse>(`/rooms/${roomId}/settings`, request);
  return data;
}

export async function uploadRoomImage(roomId: string, image: File) {
  const form = new FormData();
  form.append("image", image);
  const { data } = await api.post<{ image: string }>(`/rooms/${roomId}/image`, form);
  return data;
}

export async function deleteRoomImage(roomId: string) {
  await api.delete(`/rooms/${roomId}/image`);
}

export async function joinRoom(code: number) {
  const { data } = await api.post<JoinRoomResponse>(`/rooms/join`, { code });
  return data;
}

export interface TurnCredentialsResponse {
  urls: string[];
  username: string;
  credential: string;
  expires_at: number;
}

export async function getTurnCredentials() {
  const { data } = await api.get<TurnCredentialsResponse>(`/turn/credentials`);
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

export interface RoomSubtitleResponse {
  id: string;
  filename: string;
  subtitle_url: string;
  subtitles: SubtitleTrack[];
}

export interface UploadRoomMediaResponse {
  upload_id: string;
  video_url: string;
  subtitle_url?: string | null;
  subtitles?: SubtitleTrack[];
}

export async function uploadRoomMedia(
  roomId: string,
  videoFile: File,
  subtitleFile?: File | null,
  onUploadProgress?: (percent: number) => void,
) {
  const form = new FormData();
  form.append("video", videoFile);
  if (subtitleFile) form.append("subtitle", subtitleFile);

  const { data } = await api.post<UploadRoomMediaResponse>(`/rooms/${roomId}/media`, form, {
    onUploadProgress: (event) => {
      if (event.total) onUploadProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
  });
  return data;
}

export async function getSharedRoomSubtitles(url: string) {
  const { data } = await api.get<{ tracks: SubtitleTrack[] }>(url);
  return data.tracks ?? [];
}

export async function submitRoomSubtitle(
  roomId: string,
  input: { file?: File; url?: string },
) {
  const form = new FormData();
  if (input.file) form.append("subtitle", input.file);
  if (input.url?.trim()) form.append("url", input.url.trim());

  const { data } = await api.post<RoomSubtitleResponse>(`/rooms/${roomId}/subtitle`, form);
  return data;
}

export function getRoomApiErrorMessage(error: unknown, fallback = "عملیات انجام نشد."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message.trim();
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

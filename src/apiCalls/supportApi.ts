import api from "../lib/axiosConfig";
import { getAccessToken } from "../lib/authToken";

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: "visitor" | "admin";
  content: string;
  created_at: string;
}

export interface SupportConversation {
  id: string;
  visitor_id: string;
  visitor_name: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
}

export interface SupportDefaultAnswer {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SupportConversationListItem {
  id: string;
  visitor_id: string;
  visitor_name: string;
  status: "open" | "closed";
  latest_message: string;
  updated_at: string;
}

const WS_BASE = (
  import.meta.env.VITE_WS_URL ||
  String(import.meta.env.VITE_BASE_URL || "")
    .replace(/^http/, "ws")
    .replace(/\/api\/?$/, "/api")
).replace(/\/$/, "");

export function getSupportWsUrl(
  conversationId: string,
  role: "visitor" | "admin",
  visitorId?: string,
) {
  const params = new URLSearchParams();
  if (role === "visitor") {
    params.set("visitor_id", visitorId || "");
  } else {
    const token = getAccessToken();
    if (token) params.set("access_token", token);
  }
  const path =
    role === "admin"
      ? `/admin/support/conversations/${conversationId}/ws/admin`
      : `/support/conversations/${conversationId}/ws/visitor`;
  return `${WS_BASE}${path}?${params.toString()}`;
}

export const supportApi = {
  createConversation: (payload: {
    visitor_id?: string;
    name: string;
    message: string;
    turnstile_token: string;
  }) => api.post<SupportConversation>("/support/conversations", payload),

  getConversation: (id: string, visitorId: string) =>
    api.get<SupportConversation>(`/support/conversations/${id}`, {
      params: { visitor_id: visitorId },
    }),

  listAdminConversations: () =>
    api.get<{ conversations: SupportConversationListItem[] }>(
      "/admin/support/conversations",
    ),

  getAdminConversation: (id: string) =>
    api.get<SupportConversation>(`/admin/support/conversations/${id}`),

  closeAdminConversation: (id: string) =>
    api.post<{ success: boolean }>(`/admin/support/conversations/${id}/close`),

  listDefaultAnswers: () =>
    api.get<{ answers: SupportDefaultAnswer[] }>("/admin/support/default-answers"),
  createDefaultAnswer: (payload: { title: string; content: string }) =>
    api.post<SupportDefaultAnswer>("/admin/support/default-answers", payload),
  updateDefaultAnswer: (id: string, payload: { title: string; content: string }) =>
    api.patch<SupportDefaultAnswer>(`/admin/support/default-answers/${id}`, payload),
  deleteDefaultAnswer: (id: string) =>
    api.delete(`/admin/support/default-answers/${id}`),
};

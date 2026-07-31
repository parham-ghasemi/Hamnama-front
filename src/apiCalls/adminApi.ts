import api from "../lib/axiosConfig";

export interface AdminDashboardResponse {
  stats: {
    users: {
      this_week: number;
      this_month: number;
      this_year: number;
      all_time: number;
    };
    rooms: {
      this_week: number;
      this_month: number;
      this_year: number;
      all_time: number;
    };
  };
  charts: {
    users_over_time: Array<{ label: string; count: number }>;
    rooms_over_time: Array<{ label: string; count: number }>;
  };
}

export interface AdminTicketListItem {
  id: number;
  subject: string;
  status: string;
  created_at: string;
}

export interface AdminTicketMessage {
  id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
  is_admin_sender: boolean;
}

export interface AdminTicketDetails {
  id: number;
  subject: string;
  status: string;
  created_at: string;
  messages: AdminTicketMessage[];
}

export interface AdminUser {
  id: string;
  username: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  profile_picture?: string;
  hours_watched: number;
  level: string;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason?: string;
  ban_expires_at?: string;
  banned_at?: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminRoom {
  id: string;
  code: number;
  created_by: string;
  currently_playing?: string;
  playback_time: number;
  is_public: boolean;
  media_control_permission: string;
  created_at: string;
  updated_at: string;
  is_closed: boolean;
  closed_at?: string;
}

export interface AdminRoomsResponse {
  rooms: AdminRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ArchiveJobResponse {
  job_id: string;
  status: string;
  status_url: string;
}

export interface ArchiveJobStatusResponse {
  status: string;
  finished_at?: string;
  error?: string;
}

export const adminApi = {
  getDashboard: () => api.get<AdminDashboardResponse>("/admin/dashboard"),

  getTickets: () => api.get<{ tickets: AdminTicketListItem[] }>('/admin/tickets'),
  getTicket: (id: string | number) => api.get<AdminTicketDetails>(`/admin/tickets/${id}`),
  replyToTicket: (id: string | number, message: string) => api.post(`/admin/tickets/${id}/reply`, { message }),
  closeTicket: (id: string | number) => api.post(`/admin/tickets/${id}/close`),
  reopenTicket: (id: string | number) => api.post(`/admin/tickets/${id}/reopen`),

  listUsers: (params: Record<string, string | number | boolean | undefined>) => api.get<AdminUsersResponse>('/admin/users', { params }),
  updateUser: (id: string, payload: Record<string, unknown>) => api.patch(`/admin/users/${id}`, payload),
  banUser: (id: string, payload: { reason: string; expires_at?: string; permanent?: boolean }) => api.post(`/admin/users/${id}/ban`, payload),
  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`),

  listRooms: (params: Record<string, string | number | boolean | undefined>) => api.get<AdminRoomsResponse>('/admin/rooms', { params }),
  closeRoom: (id: string) => api.post(`/admin/rooms/${id}/close`),
  reopenRoom: (id: string) => api.post(`/admin/rooms/${id}/reopen`),

  triggerArchiveScrape: (url: string) => api.post<ArchiveJobResponse>('/admin/scrape', { url }),
  getArchiveJobStatus: (id: string) => api.get<ArchiveJobStatusResponse>(`/admin/scrape/${id}`),
};

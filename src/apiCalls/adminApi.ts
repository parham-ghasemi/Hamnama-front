import api from "../lib/axiosConfig";
import { getAccessToken } from "../lib/authToken";

export interface AdminDashboardResponse {
  online_users: number;
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

export type WebsiteAnalyticsRange = '30d' | '90d' | '365d' | 'all';
export type WebsiteAnalyticsAccountFilter = 'all' | 'account' | 'guest';

export interface WebsiteAnalyticsResponse {
  unique_visitors: number;
  visits_over_time: Array<{ label: string; count: number }>;
}

export interface AdminNotificationsResponse {
  tickets_needing_response: number;
  support_needing_response: number;
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
  access_level: number;
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
  created_by_name: string;
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

export type AnnouncementType = 'room' | 'website';

export interface AdminAnnouncement {
  id: string;
  type: AnnouncementType;
  message: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminAnnouncementsResponse {
  announcements: AdminAnnouncement[];
}

export type ArchiveScraper = 'old' | 'new';

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

export interface ScrapeJob {
  job_id: string;
  url: string;
  status: string;
  created_at: string;
  finished_at?: string;
  error?: string;
}

export interface ScrapeJobsResponse {
  jobs: ScrapeJob[];
}

export interface ScrapeStatusEvent {
  done: boolean;
}

export interface ScrapeFailedEvent {
  done: boolean;
  error?: string;
}

export interface SubtitleSyncResponse {
  job_id: string;
  status: string;
}

export interface SubtitleSyncStatusResponse {
  job_id: string;
  status: string;
  processed: number;
  total: number;
  error?: string;
}


export interface AdminArchiveFileInput {
  url: string;
  filename: string;
  season?: number | null;
  episode?: number | null;
  quality_tags?: string;
  version?: string;
  release?: string;
  size?: string;
  status: number;
  content_type?: string;
  valid: boolean;
  final_url?: string;
  error?: string;
}

export interface AdminArchiveReport {
  id: string;
  media_id: string;
  user_id: string;
  username: string;
  phone: string;
  target_type: 'media' | 'episode' | 'file';
  season?: number;
  episode?: number;
  file_url?: string;
  report_type: string;
  custom_text?: string;
  created_at: string;
}

export interface AdminArchiveReportsResponse {
  reports: AdminArchiveReport[];
}

export interface AdminArchiveReportGroup {
  media_id: string;
  title_en: string;
  title_fa: string;
  type: 'movie' | 'series';
  poster?: string;
  report_count: number;
}

export interface AdminArchiveReportGroupsResponse {
  items: AdminArchiveReportGroup[];
}

export interface SubtitleHealthReport {
  total_items: number;
  valid_items: number;
  invalid_items: number;
  valid_percentage: number;
}

export interface AdminArchiveItem {
  id: string;
  type: 'movie' | 'series';
  title_en: string;
  title_fa: string;
  year: string;
  rating: string;
  votes: string;
  links: unknown;
  related: string[];
  omdb?: unknown;
  rated?: string;
  released?: string;
  runtime?: string;
  genre?: string;
  director?: string;
  writer?: string;
  actors?: string;
  plot?: string;
  language?: string;
  country?: string;
  awards?: string;
  poster?: string;
  metascore?: string;
  box_office?: string;
  imdb_rating?: string;
  imdb_votes?: string;
  files: AdminArchiveFileInput[];
  enabled: boolean;
}

export interface AdminArchiveResponse {
  data: AdminArchiveItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ADMIN_BASE = String(import.meta.env.VITE_BASE_URL || '').replace(/\/api\/?$/, '');

export const getScrapeProgressUrl = (id: string) => {
  const params = new URLSearchParams();
  const token = getAccessToken();
  if (token) params.set('access_token', token);
  const query = params.toString();
  return `${ADMIN_BASE}/api/admin/scrape/${id}/events${query ? `?${query}` : ''}`;
};

export const adminApi = {
  getAccess: () => api.get<{ user_id: string; access_level: number }>("/admin/access"),
  getDashboard: () => api.get<AdminDashboardResponse>("/admin/dashboard"),
  getWebsiteAnalytics: (range: WebsiteAnalyticsRange, account: WebsiteAnalyticsAccountFilter) =>
    api.get<WebsiteAnalyticsResponse>('/admin/website-analytics', { params: { range, account } }),
  getNotifications: () => api.get<AdminNotificationsResponse>('/admin/notifications'),

  getTickets: () => api.get<{ tickets: AdminTicketListItem[] }>('/admin/tickets'),
  getTicket: (id: string | number) => api.get<AdminTicketDetails>(`/admin/tickets/${id}`),
  replyToTicket: (id: string | number, message: string) => api.post(`/admin/tickets/${id}/reply`, { message }),
  closeTicket: (id: string | number) => api.post(`/admin/tickets/${id}/close`),
  reopenTicket: (id: string | number) => api.post(`/admin/tickets/${id}/reopen`),

  listUsers: (params: Record<string, string | number | boolean | undefined>) => api.get<AdminUsersResponse>('/admin/users', { params }),
  updateUser: (id: string, payload: Record<string, unknown>) => api.patch(`/admin/users/${id}`, payload),
  banUser: (id: string, payload: { reason: string; duration: | '1week' | '1month' | '3months' | '6months' | '1year' | 'forever'; }) => api.post(`/admin/users/${id}/ban`, payload),
  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`),

  listRooms: (params: Record<string, string | number | boolean | undefined>) => api.get<AdminRoomsResponse>('/admin/rooms', { params }),
  closeRoom: (id: string) => api.post(`/admin/rooms/${id}/close`),
  reopenRoom: (id: string) => api.post(`/admin/rooms/${id}/reopen`),

  listAnnouncements: (type: AnnouncementType) =>
    api.get<AdminAnnouncementsResponse>('/admin/announcements', { params: { type } }),
  createAnnouncement: (type: AnnouncementType, message: string) =>
    api.post<AdminAnnouncement>('/admin/announcements', { type, message }),
  setAnnouncementActive: (id: string, active: boolean) =>
    api.patch<{ success: boolean; active: boolean }>(`/admin/announcements/${id}/active`, { active }),
  deleteAnnouncement: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/announcements/${id}`),

  triggerArchiveScrape: (url: string, scraper: ArchiveScraper = 'old') =>
    api.post<ArchiveJobResponse>('/admin/scrape', { url, scraper }),
  getArchiveJobStatus: (id: string) => api.get<ArchiveJobStatusResponse>(`/admin/scrape/${id}`),
  getScrapeJobs: () => api.get<ScrapeJobsResponse>('/admin/scrape'),

  listArchive: (params?: { search?: string; type?: string; page?: number; limit?: number }) =>
    api.get<AdminArchiveResponse>('/admin/archive', { params }),
  getArchiveItem: (id: string) => api.get<AdminArchiveItem>(`/admin/archive/${id}`),
  createArchiveItem: (payload: Record<string, unknown>) =>
    api.post<AdminArchiveItem>('/admin/archive', payload),
  updateArchiveItem: (id: string, payload: Record<string, unknown>) =>
    api.patch<AdminArchiveItem>(`/admin/archive/${id}`, payload),
  deleteArchiveItem: (id: string) => api.delete(`/admin/archive/${id}`),
  setArchiveItemEnabled: (id: string, enabled: boolean) => api.patch<{ success: boolean; enabled: boolean }>(`/admin/archive/${id}/enabled`, { enabled }),
  getArchiveReports: (id: string) => api.get<AdminArchiveReportsResponse>(`/admin/archive/${id}/reports`),
  getArchiveReportGroups: () => api.get<AdminArchiveReportGroupsResponse>('/admin/archive/reports'),

  triggerSubtitleSync: () => api.post<SubtitleSyncResponse>('/admin/subtitles/sync'),
  getSubtitleSyncStatus: (id: string) => api.get<SubtitleSyncStatusResponse>(`/admin/subtitles/sync/${id}`),
  getSubtitleHealthReport: () => api.get<SubtitleHealthReport>('/admin/subtitles/report'),
  getInvalidSubtitleItems: (params?: { page?: number; limit?: number }) => api.get<AdminArchiveResponse>('/admin/subtitles/invalid', { params }),
};

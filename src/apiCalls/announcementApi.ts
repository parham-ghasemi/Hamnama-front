import api from "../lib/axiosConfig";

export interface WebsiteAnnouncement {
  id: string;
  type: "website";
  message: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebsiteAnnouncementsResponse {
  announcements: WebsiteAnnouncement[];
}

export async function getWebsiteAnnouncements() {
  const { data } = await api.get<WebsiteAnnouncementsResponse>("/announcements/website");
  return data;
}

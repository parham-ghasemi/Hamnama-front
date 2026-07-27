import api from "../lib/axiosConfig";

export interface MediaListItem {
  imdbCode: string;
  title: string;
  titleType: string;
  imdbVotes: number;
  imdbRates: number;
  image?: string;
  genre?: string;
}

export interface PaginatedMediaResponse {
  data: MediaListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MediaVersionItem {
  id: number;
  subType?: string;
  season?: string;
  quality?: string;
  fileUrl: string;
  size?: string;
}

export interface MediaDetailResponse {
  imdbCode: string;
  title: string;
  titleType: string;
  imdbVotes: number;
  imdbRates: number;
  image?: string;
  description?: string;
  genre?: string;
  versions: MediaVersionItem[];
}

export interface GetMediaListParams {
  search?: string;
  type?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const archiveApi = {
  getMediaList: (params?: GetMediaListParams) =>
    api.get<PaginatedMediaResponse>("/media", { params }),
  getMediaDetails: (id: string) =>
    api.get<MediaDetailResponse>(`/media/${id}`),
};
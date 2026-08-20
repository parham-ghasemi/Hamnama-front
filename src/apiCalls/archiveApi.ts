import api from "../lib/axiosConfig";

export interface MediaFileItem {
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

export interface OmdbResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  BoxOffice: string;
  Response: string;
  Error?: string;
}

export interface MediaListItem {
  id: string;
  type: "movie" | "series";
  title_en: string;
  title_fa: string;
  year: string;
  rating: string;
  votes: string;
  poster?: string;
}

export interface MediaDetailResponse extends MediaListItem {
  links: unknown;
  related: string[];
  related_media?: MediaListItem[];
  omdb?: OmdbResponse;
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
  metascore?: string;
  box_office?: string;
  imdb_rating?: string;
  imdb_votes?: string;
  files: MediaFileItem[];
}

export interface PaginatedMediaResponse {
  data: MediaListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

  getRelatedMedia: (currentFileUrl: string) =>
    api.get<MediaListItem[]>("/media/related", {
      params: { url: currentFileUrl },
    }),
};

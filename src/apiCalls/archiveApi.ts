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

export type ArchiveReportTarget = 'media' | 'episode' | 'file';

export interface ArchiveReportInput {
  target_type: ArchiveReportTarget;
  season?: number | null;
  episode?: number | null;
  file_url?: string;
  report_type: string;
  custom_text?: string;
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
  enabled?: boolean;
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

export interface FavoriteListResponse {
  data: MediaListItem[];
}

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

export interface SubtitleResponse {
  media_id: string;
  type: "movie" | "series";
  season?: number;
  episode?: number;
  tracks: SubtitleTrack[];
}

export interface GetMediaListParams {
  search?: string;
  type?: string;
  sort?: string;
  genres?: string[];
  page?: number;
  limit?: number;
}

export const archiveApi = {
  getMediaList: (params?: GetMediaListParams) =>
    api.get<PaginatedMediaResponse>("/media", {
      params: {
        ...params,
        genres: params?.genres?.length ? params.genres.join(",") : undefined,
      },
    }),

  getMediaDetails: (id: string) =>
    api.get<MediaDetailResponse>(`/media/${id}`),

  getRelatedMedia: (currentFileUrl: string) =>
    api.get<MediaListItem[]>("/media/related", {
      params: { url: currentFileUrl },
    }),

  getFavorites: () =>
    api.get<FavoriteListResponse>("/users/me/favorites"),

  addFavorite: (mediaId: string) =>
    api.post<MediaListItem>("/users/me/favorites", { media_id: mediaId }),

  removeFavorite: (mediaId: string) =>
    api.delete(`/users/me/favorites/${mediaId}`),

  getSubtitles: (mediaId: string, params?: { season?: number | null; episode?: number | null }) =>
    api.get<SubtitleResponse>(`/media/${mediaId}/subtitles`, {
      params: {
        season: params?.season ?? undefined,
        episode: params?.episode ?? undefined,
      },
    }),

  createArchiveReport: (mediaId: string, payload: ArchiveReportInput) =>
    api.post(`/media/${encodeURIComponent(mediaId)}/reports`, payload),

  getSubtitlesUrl: (
    mediaId: string,
    params?: { season?: number | null; episode?: number | null }
  ) => {
    const rawBase = String(
      import.meta.env["VITE_BASE_URL"] ?? window.location.origin
    ).replace(/\/+$/, "");

    const originBase = rawBase.startsWith("/")
      ? window.location.origin
      : rawBase;

    const url = new URL(
      `/api/media/${encodeURIComponent(mediaId)}/subtitles`,
      originBase.replace(/\/api$/i, "")
    );

    if (params?.season != null) {
      url.searchParams.set("season", String(params.season));
    }

    if (params?.episode != null) {
      url.searchParams.set("episode", String(params.episode));
    }

    return url.toString();
  },
};

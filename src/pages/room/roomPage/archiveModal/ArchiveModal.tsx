import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import {
  TbArchiveFilled,
  TbArrowRight,
  TbChevronLeft,
  TbChevronRight,
  TbDeviceTv,
  TbInfoCircle,
  TbLink,
  TbLoader2,
  TbMovie,
  TbSearch,
  TbStarFilled,
  TbX,
} from "react-icons/tb";
import {
  archiveApi,
  type MediaDetailResponse,
  type MediaFileItem,
  type MediaListItem,
} from "../../../../apiCalls/archiveApi";
import "./ArchiveModal.scss";

export interface SelectedArchiveMedia {
  id: string;
  title: string;
  type: "movie" | "series";
  url: string;
  quality?: string;
  season?: number | null;
  episode?: number | null;
  nextEpisode?: SelectedArchiveMedia | null;
}

interface ArchiveModalProps {
  isOpen: boolean;
  closeModal: () => void;
  onSelectMedia: (media: SelectedArchiveMedia) => void;
  currentPlaying?: string | null;
  currentPlayingId?: string;
}

const typeLabel = (type?: string) => {
  if (type === "series") return "سریال";
  if (type === "movie") return "فیلم";
  return type || "نامشخص";
};

const clean = (value: unknown) => {
  if (value === null || value === undefined || value === "" || value === "N/A") return "—";
  return String(value);
};

const qualityScore = (value?: string | null) => {
  if (!value) return 0;
  const normalized = value.toLowerCase();
  const resolution = normalized.match(/(\d{3,4})p/);
  if (resolution) return Number(resolution[1]);
  const sourceRank = [
    { token: "2160", value: 2160 },
    { token: "4k", value: 2160 },
    { token: "1440", value: 1440 },
    { token: "1080", value: 1080 },
    { token: "720", value: 720 },
    { token: "576", value: 576 },
    { token: "480", value: 480 },
    { token: "360", value: 360 },
  ];
  return sourceRank.find((item) => normalized.includes(item.token))?.value ?? 0;
};

const getNextEpisodeFile = (files: MediaFileItem[], current: MediaFileItem) => {
  if (current.season == null || current.episode == null) return null;

  const ordered = files
    .filter((file) => file.valid && !!(file.final_url || file.url) && file.season != null && file.episode != null)
    .sort((a, b) => {
      const seasonDiff = Number(a.season) - Number(b.season);
      return seasonDiff || Number(a.episode) - Number(b.episode);
    });

  const nextEpisodeNumber = ordered.find(
    (file) =>
      Number(file.season) > Number(current.season) ||
      (Number(file.season) === Number(current.season) && Number(file.episode) > Number(current.episode)),
  );

  if (!nextEpisodeNumber) return null;

  const sameEpisodeCandidates = ordered.filter(
    (file) =>
      Number(file.season) === Number(nextEpisodeNumber.season) &&
      Number(file.episode) === Number(nextEpisodeNumber.episode),
  );

  const currentQualityTags = String(current.quality_tags || "").trim().toLowerCase();
  const currentVersion = String(current.version || "").trim().toLowerCase();
  const currentScore = qualityScore(current.quality_tags || current.version);

  return sameEpisodeCandidates.sort((a, b) => {
    const aQualityTags = String(a.quality_tags || "").trim().toLowerCase();
    const bQualityTags = String(b.quality_tags || "").trim().toLowerCase();
    const aVersion = String(a.version || "").trim().toLowerCase();
    const bVersion = String(b.version || "").trim().toLowerCase();

    // Preserve the variant the user is currently watching first (e.g. softsub
    // should beat dubbed), then prefer the same source/version (e.g. BluRay),
    // and only then fall back to the closest resolution.
    const aQualityTagsExact = Boolean(currentQualityTags) && aQualityTags === currentQualityTags;
    const bQualityTagsExact = Boolean(currentQualityTags) && bQualityTags === currentQualityTags;
    if (aQualityTagsExact !== bQualityTagsExact) return aQualityTagsExact ? -1 : 1;

    const aVersionExact = Boolean(currentVersion) && aVersion === currentVersion;
    const bVersionExact = Boolean(currentVersion) && bVersion === currentVersion;
    if (aVersionExact !== bVersionExact) return aVersionExact ? -1 : 1;

    const aQuality = qualityScore(a.quality_tags || a.version);
    const bQuality = qualityScore(b.quality_tags || b.version);
    return Math.abs(aQuality - currentScore) - Math.abs(bQuality - currentScore);
  })[0] ?? null;
};

const buildNextEpisode = (
  detail: MediaDetailResponse,
  file: MediaFileItem,
  depth = 0,
): SelectedArchiveMedia | null => {
  if (detail.type !== "series" || depth > 20) return null;

  const nextFile = getNextEpisodeFile(detail.files ?? [], file);
  if (!nextFile) return null;

  return {
    id: detail.id,
    title: `${detail.title_en} (${detail.title_fa})`,
    type: detail.type,
    url: nextFile.final_url || nextFile.url,
    quality: nextFile.quality_tags || nextFile.version || "quality",
    season: nextFile.season ?? null,
    episode: nextFile.episode ?? null,
    nextEpisode: buildNextEpisode(detail, nextFile, depth + 1),
  };
};


const MediaCard: React.FC<{
  item: MediaListItem;
  onClick: () => void;
  compact?: boolean;
}> = ({ item, onClick, compact = false }) => (
  <button
    type="button"
    className={clsx("archive-card", compact && "archive-card--compact")}
    onClick={onClick}
  >
    <div className="archive-card__poster-wrapper">
      {item.poster ? (
        <img
          src={item.poster}
          alt={item.title_en || item.title_fa || item.id}
          className="archive-card__poster"
          loading="lazy"
        />
      ) : (
        <div className="archive-card__poster-fallback">
          {item.type === "series" ? <TbDeviceTv /> : <TbMovie />}
        </div>
      )}

      <span className="archive-card__type">{typeLabel(item.type)}</span>

      {item.rating && item.rating !== "N/A" && (
        <span className="archive-card__rating">
          <TbStarFilled /> {item.rating}
        </span>
      )}
    </div>

    <div className="archive-card__info">
      <strong className="archive-card__title">{item.title_en || item.title_fa}</strong>
      {item.title_fa && item.title_en && (
        <span className="archive-card__fa-title">{item.title_fa}</span>
      )}
      <span className="archive-card__meta">
        {clean(item.year)}{item.votes ? ` · ${item.votes} رأی` : ""}
      </span>
    </div>
  </button>
);

const FileCard: React.FC<{
  file: MediaFileItem;
  onSelect: () => void;
}> = ({ file, onSelect }) => (
  <article className={clsx("archive-file", !file.valid && "archive-file--invalid")}>
    <div className="archive-file__topline">
      <div className="archive-file__badges">
        {file.season != null && <span className="archive-badge archive-badge--season">فصل {file.season}</span>}
        {file.episode != null && <span className="archive-badge archive-badge--season">قسمت {file.episode}</span>}
        {file.quality_tags && <span className="archive-badge archive-badge--qual">{file.quality_tags}</span>}
        {file.version && <span className="archive-badge">{file.version}</span>}
        {file.release && <span className="archive-badge">{file.release}</span>}
      </div>

      <button type="button" className="archive-file__select" onClick={onSelect} disabled={!file.url || !file.valid}>
        <TbLink />
        <span>انتخاب</span>
      </button>
    </div>

    {file.size && (
      <div className="archive-file__meta-row">
        {file.size && <span className="archive-file__size">{file.size}</span>}
      </div>
    )}
  </article>
);

const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  closeModal,
  onSelectMedia,
  currentPlaying,
  currentPlayingId
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(currentPlayingId || null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("rates_desc");
  const [page, setPage] = useState(1);

  const listQuery = useQuery({
    queryKey: ["archiveMediaList", { search, typeFilter, sortBy, page }],
    queryFn: async () => {
      const response = await archiveApi.getMediaList({
        search,
        type: typeFilter,
        sort: sortBy,
        page,
        limit: 12,
      });
      return response.data;
    },
    enabled: isOpen,
    staleTime: 60_000,
  });

  const detailQuery = useQuery<MediaDetailResponse>({
    queryKey: ["archiveMediaDetails", selectedId],
    queryFn: async () => (await archiveApi.getMediaDetails(selectedId!)).data,
    enabled: isOpen && !!selectedId,
    staleTime: 5 * 60_000,
  });

  const relatedQuery = useQuery<MediaListItem[]>({
    queryKey: ["archiveCurrentlyPlayingRelated", currentPlaying],
    queryFn: async () => (await archiveApi.getRelatedMedia(currentPlaying!)).data,
    enabled: isOpen && !!currentPlaying,
    staleTime: 60_000,
  });

  const detail = detailQuery.data;
  const relatedFromDetail = detail?.related_media ?? [];
  const contextRelated = relatedQuery.data ?? [];

  const suggested = useMemo(() => {
    const source = selectedId ? relatedFromDetail : contextRelated;
    const seen = new Set<string>();
    return source.filter((item) => {
      if (item.id === selectedId || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [contextRelated, relatedFromDetail, selectedId]);

  const close = () => {
    closeModal();
  };

  const selectFile = (file: MediaFileItem) => {
    if (!detail) return;

    const nextEpisode = buildNextEpisode(detail, file);

    onSelectMedia({
      id: detail.id,
      title: `${detail.title_en} (${detail.title_fa})`,
      type: detail.type,
      url: file.final_url || file.url,
      quality: file.quality_tags || file.version || "quality",
      season: file.season ?? null,
      episode: file.episode ?? null,
      nextEpisode,
    });
    close();
  };

  if (!isOpen) return null;

  const mediaList = listQuery.data?.data ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;

  return (
    <div className={clsx("archive-modal", isOpen && "open")} onClick={(e) => e.stopPropagation()}>
      <header className="archive-modal__head">
        <div className="archive-modal__head-title">
          <TbArchiveFilled />
          <div>
            <strong>آرشیو فیلم و سریال</strong>
            <span>جستجو و انتخاب نسخه قابل پخش</span>
          </div>
        </div>
        <button type="button" className="archive-modal__close-btn" onClick={close} aria-label="بستن">
          <TbX />
        </button>
      </header>

      <div className="archive-modal__body">
        {selectedId ? (
          <section className="archive-detail">
            <button type="button" className="archive-modal__back-btn" onClick={() => setSelectedId(null)}>
              <TbArrowRight />
              <span>بازگشت به آرشیو</span>
            </button>

            {detailQuery.isLoading ? (
              <div className="archive-modal__loading">
                <TbLoader2 className="spinner" />
                <span>در حال دریافت اطلاعات...</span>
              </div>
            ) : detail ? (
              <>
                <section className="archive-hero">
                  <div className="archive-hero__poster">
                    {detail.poster ? (
                      <img src={detail.poster} alt={detail.title_en} />
                    ) : (
                      <div className="archive-card__poster-fallback">
                        {detail.type === "series" ? <TbDeviceTv /> : <TbMovie />}
                      </div>
                    )}
                  </div>

                  <div className="archive-hero__content">
                    <div className="archive-hero__badges">
                      <span className="archive-pill">{typeLabel(detail.type)}</span>
                      {detail.year && <span className="archive-pill">{detail.year}</span>}
                      {detail.rating && (
                        <span className="archive-pill archive-pill--rating">
                          <TbStarFilled /> {detail.rating}
                        </span>
                      )}
                    </div>
                    <h1>{detail.title_en || detail.title_fa}</h1>
                    {detail.title_fa && detail.title_en && <h2>{detail.title_fa}</h2>}
                    <p className="archive-hero__plot">{clean(detail.plot || detail.omdb?.Plot)}</p>
                    <div className="archive-hero__meta">
                      {detail.runtime && <span>{detail.runtime}</span>}
                      {detail.genre && <span>{detail.genre}</span>}
                      {detail.language && <span>{detail.language}</span>}
                      {detail.country && <span>{detail.country}</span>}
                    </div>
                    {(detail.director || detail.actors) && (
                      <div className="archive-hero__credits">
                        {detail.director && detail.director !== "N/A" && (
                          <p><strong>کارگردان:</strong> {detail.director}</p>
                        )}
                        {detail.actors && detail.actors !== "N/A" && (
                          <p><strong>بازیگران:</strong> {detail.actors}</p>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {suggested.length > 0 && (
                  <section className="archive-section">
                    <div className="archive-section__heading">
                      <div>
                        <span className="archive-section__eyebrow">پیشنهاد برای تماشا</span>
                        <h3>مرتبط با این عنوان</h3>
                      </div>
                    </div>
                    <div className="archive-related-grid">
                      {suggested.map((item) => (
                        <MediaCard key={item.id} item={item} onClick={() => setSelectedId(item.id)} compact />
                      ))}
                    </div>
                  </section>
                )}

                <section className="archive-section">
                  <div className="archive-section__heading">
                    <div>
                      <span className="archive-section__eyebrow">نسخه‌های قابل پخش</span>
                      <h3>{detail.files?.length ?? 0} فایل</h3>
                    </div>
                  </div>
                  {detail.files?.length ? (
                    <div className="archive-files">
                      {detail.files.map((file, index) => (
                        <FileCard key={`${file.url}-${index}`} file={file} onSelect={() => selectFile(file)} />
                      ))}
                    </div>
                  ) : (
                    <p className="archive-modal__empty archive-modal__empty--inline">
                      هیچ فایل قابل انتخابی برای این عنوان ثبت نشده است.
                    </p>
                  )}
                </section>
              </>
            ) : (
              <p className="archive-modal__empty">اطلاعات یافت نشد.</p>
            )}
          </section>
        ) : (
          <section className="archive-list">
            <div className="archive-modal__controls">
              <div className="archive-modal__search">
                <TbSearch />
                <input
                  type="search"
                  data-video-keyboard-ignore
                  placeholder="نام فارسی، انگلیسی یا IMDb ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="archive-modal__filters">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                  <option value="">همه انواع</option>
                  <option value="movie">فیلم</option>
                  <option value="series">سریال</option>
                </select>
                <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
                  <option value="rates_desc">امتیاز بیشتر</option>
                  <option value="votes_desc">رأی بیشتر</option>
                  <option value="year_desc">جدیدتر</option>
                  <option value="title_asc">عنوان</option>
                </select>
              </div>
            </div>

            {contextRelated.length > 0 && (
              <section className="archive-section archive-section--context">
                <div className="archive-section__heading">
                  <div>
                    <span className="archive-section__eyebrow">پیشنهاد هوشمند</span>
                    <h3>بر اساس محتوای در حال پخش</h3>
                  </div>
                </div>
                <div className="archive-related-grid archive-related-grid--list">
                  {contextRelated.map((item) => (
                    <MediaCard key={item.id} item={item} onClick={() => setSelectedId(item.id)} compact />
                  ))}
                </div>
              </section>
            )}

            {listQuery.isLoading ? (
              <div className="archive-modal__loading">
                <TbLoader2 className="spinner" />
                <span>در حال دریافت آرشیو...</span>
              </div>
            ) : mediaList.length > 0 ? (
              <>
                <div className="archive-list__summary">
                  <span>{listQuery.data?.total.toLocaleString("fa-IR")} عنوان</span>
                </div>
                <div className="archive-modal__grid">
                  {mediaList.map((item) => (
                    <MediaCard key={item.id} item={item} onClick={() => setSelectedId(item.id)} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="archive-modal__pagination">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <TbChevronRight />
                    </button>
                    <span>
                      صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
                    </span>
                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      <TbChevronLeft />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="archive-modal__empty">
                <TbInfoCircle />
                <span>هیچ عنوانی با این مشخصات پیدا نشد.</span>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ArchiveModal;

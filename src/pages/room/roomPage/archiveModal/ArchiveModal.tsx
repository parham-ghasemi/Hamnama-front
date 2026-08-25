import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import {
  TbArchiveFilled,
  TbArrowRight,
  TbChevronDown,
  TbChevronLeft,
  TbChevronRight,
  TbDeviceTv,
  TbInfoCircle,
  TbLink,
  TbLoader2,
  TbMovie,
  TbSparkles,
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
  softsub?: boolean;
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

const isSoftsubFile = (file: MediaFileItem) => {
  const searchable = [
    file.quality_tags,
    file.version,
    file.release,
    (file as MediaFileItem & { filename?: string; name?: string }).filename,
    (file as MediaFileItem & { filename?: string; name?: string }).name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.replace(/[\s._-]/g, "").includes("softsub");
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

const buildNextEpisode = (detail: MediaDetailResponse, file: MediaFileItem, depth = 0): SelectedArchiveMedia | null => {
  if (detail.type !== "series" || depth > 20) return null;

  const nextFile = getNextEpisodeFile(detail.files ?? [], file);
  if (!nextFile) return null;

  return {
    id: detail.id,
    title: `${detail.title_en} (${detail.title_fa})`,
    type: detail.type,
    url: nextFile.final_url || nextFile.url,
    quality: nextFile.quality_tags || nextFile.version || "quality",
    softsub: isSoftsubFile(nextFile),
    season: nextFile.season ?? null,
    episode: nextFile.episode ?? null,
    nextEpisode: buildNextEpisode(detail, nextFile, depth + 1),
  };
};

const translatedVersion = (value?: string | null) => {
  if (!value) return null;
  if (value === "SoftSub") return "زیرنویس (SoftSub)";
  if (value === "HardSub") return "زیرنویس (HardSub)";
  if (value === "Dubbed") return "دوبله";
  return value;
};

const MediaCard: React.FC<{ item: MediaListItem; onClick: () => void; compact?: boolean }> = ({ item, onClick, compact = false }) => (
  <button type="button" className={clsx("archive-card", compact && "archive-card--compact")} onClick={onClick}>
    <div className="archive-card__poster-wrapper">
      {item.poster ? (
        <img src={item.poster} alt={item.title_en || item.title_fa || item.id} className="archive-card__poster" loading="lazy" />
      ) : (
        <div className="archive-card__poster-fallback">{item.type === "series" ? <TbDeviceTv /> : <TbMovie />}</div>
      )}
      <span className="archive-card__type">{typeLabel(item.type)}</span>
      {item.rating && item.rating !== "N/A" && <span className="archive-card__rating"><TbStarFilled /> {item.rating}</span>}
      <span className="archive-card__hover-icon"><TbArrowRight /></span>
    </div>
    <div className="archive-card__info">
      <strong className="archive-card__title">{item.title_en || item.title_fa}</strong>
      {item.title_fa && item.title_en && <span className="archive-card__fa-title">{item.title_fa}</span>}
      <span className="archive-card__meta">{clean(item.year)}{item.votes ? ` · ${item.votes} رأی` : ""}</span>
    </div>
  </button>
);

type ArchiveDropdownProps = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
};

const ArchiveDropdown: React.FC<ArchiveDropdownProps> = ({ label, value, options, onChange, icon, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className={clsx("archive-dropdown", open && "open")} ref={rootRef}>
      <span className="archive-dropdown__label">{label}</span>
      <button type="button" className="archive-dropdown__trigger" onClick={() => !disabled && setOpen((current) => !current)} aria-expanded={open} disabled={disabled}>
        <span className="archive-dropdown__value">{icon}{selected?.label}</span>
        <TbChevronDown />
      </button>
      <div className="archive-dropdown__menu" role="listbox">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={clsx("archive-dropdown__option", option.value === value && "selected")}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            <span>{option.label}</span>
            {option.value === value && <span className="archive-dropdown__check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

interface GroupedEpisode {
  episode: number;
  files: MediaFileItem[];
}

interface GroupedSeason {
  season: number;
  episodes: GroupedEpisode[];
}

const groupSeriesFiles = (files: MediaFileItem[]): GroupedSeason[] => {
  const seasons = new Map<number, Map<number, MediaFileItem[]>>();
  files.forEach((file) => {
    if (file.season == null || file.episode == null) return;
    const season = Number(file.season);
    const episode = Number(file.episode);
    if (!seasons.has(season)) seasons.set(season, new Map());
    const episodes = seasons.get(season)!;
    if (!episodes.has(episode)) episodes.set(episode, []);
    episodes.get(episode)!.push(file);
  });

  return Array.from(seasons.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([season, episodes]) => ({
      season,
      episodes: Array.from(episodes.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([episode, episodeFiles]) => ({ episode, files: episodeFiles })),
    }));
};

const FileVariantButton: React.FC<{ file: MediaFileItem; onSelect: () => void }> = ({ file, onSelect }) => (
  <button type="button" className={clsx("archive-variant", !file.valid && "is-invalid")} onClick={onSelect} disabled={!file.url || !file.valid}>
    <span className="archive-variant__main">
      <strong>{clean(file.quality_tags || file.version || "نسخه")}</strong>
      {file.version && <span>{translatedVersion(file.version)}</span>}
    </span>
    <span className="archive-variant__meta">
      {file.release && <span>{file.release}</span>}
      {file.size && <span>{file.size}</span>}
    </span>
    <TbLink />
  </button>
);

const ArchiveModal: React.FC<ArchiveModalProps> = ({ isOpen, closeModal, onSelectMedia, currentPlaying, currentPlayingId }) => {
  const [selectedId, setSelectedId] = useState<string | null>(currentPlayingId || null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("rates_desc");
  const [page, setPage] = useState(1);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [openSeasons, setOpenSeasons] = useState<number[]>([]);

  const listQuery = useQuery({
    queryKey: ["archiveMediaList", { search, typeFilter, sortBy, page }],
    queryFn: async () => (await archiveApi.getMediaList({ search, type: typeFilter, sort: sortBy, page, limit: 12 })).data,
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
  const groupedSeasons = useMemo(() => (detail?.type === "series" ? groupSeriesFiles(detail.files ?? []) : []), [detail]);

  const suggested = useMemo(() => {
    const source = selectedId ? relatedFromDetail : contextRelated;
    const seen = new Set<string>();
    return source.filter((item) => {
      if (item.id === selectedId || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [contextRelated, relatedFromDetail, selectedId]);

  useEffect(() => {
    if (!detail || detail.type !== "series" || !groupedSeasons.length) {
      setSelectedSeason(null);
      setOpenSeasons([]);
      return;
    }
    setSelectedSeason(null);
    setSelectedEpisode(null);
    setOpenSeasons([]);
  }, [detail, groupedSeasons]);

  const selectFile = (file: MediaFileItem) => {
    if (!detail) return;
    onSelectMedia({
      id: detail.id,
      title: `${detail.title_en} (${detail.title_fa})`,
      type: detail.type,
      url: file.final_url || file.url,
      quality: file.quality_tags || file.version || "quality",
      softsub: isSoftsubFile(file),
      season: file.season ?? null,
      episode: file.episode ?? null,
      nextEpisode: buildNextEpisode(detail, file),
    });
    closeModal();
  };

  if (!isOpen) return null;
  const mediaList = listQuery.data?.data ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;

  return (
    <div className="archive-modal open" onClick={(event) => event.stopPropagation()} dir="rtl">
      <header className="archive-modal__head">
        <div className="archive-modal__head-glow" />
        <div className="archive-modal__head-title">
          <div className="archive-modal__head-icon"><TbArchiveFilled /></div>
          <div>
            <strong>آرشیو فیلم و سریال</strong>
            <span>نسخه درست را پیدا کن، بدون اینکه مسیر تماشا را گم کنی</span>
          </div>
        </div>
        <div className="archive-modal__head-actions">
          <span className="archive-modal__head-live"><i /> زنده</span>
          <button type="button" className="archive-modal__close-btn" onClick={closeModal} aria-label="بستن"><TbX /></button>
        </div>
      </header>

      <div className="archive-modal__body">
        {selectedId ? (
          <section className="archive-detail">
            <button type="button" className="archive-modal__back-btn" onClick={() => setSelectedId(null)}><TbArrowRight /><span>بازگشت به آرشیو</span></button>

            {detailQuery.isLoading ? (
              <div className="archive-modal__loading"><TbLoader2 className="spinner" /><span>در حال دریافت اطلاعات...</span></div>
            ) : detail ? (
              <>
                <section className="archive-hero">
                  <div className="archive-hero__poster">
                    {detail.poster ? <img src={detail.poster} alt={detail.title_en} /> : <div className="archive-card__poster-fallback">{detail.type === "series" ? <TbDeviceTv /> : <TbMovie />}</div>}
                  </div>
                  <div className="archive-hero__content">
                    <div className="archive-hero__badges">
                      <span className="archive-pill">{typeLabel(detail.type)}</span>
                      {detail.year && <span className="archive-pill">{detail.year}</span>}
                      {detail.rating && <span className="archive-pill archive-pill--rating"><TbStarFilled /> {detail.rating}</span>}
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
                    {(detail.director || detail.actors) && <div className="archive-hero__credits">
                      {detail.director && detail.director !== "N/A" && <p><strong>کارگردان:</strong> {detail.director}</p>}
                      {detail.actors && detail.actors !== "N/A" && <p><strong>بازیگران:</strong> {detail.actors}</p>}
                    </div>}
                  </div>
                </section>

                {detail.type === "series" ? (
                  <section className="archive-section archive-section--series">
                    <div className="archive-section__heading">
                      <div><span className="archive-section__eyebrow">مسیریاب سریال</span><h3>فصل و قسمت را سریع پیدا کن</h3></div>
                      <span className="archive-section__count">{detail.files?.length ?? 0} فایل</span>
                    </div>
                    <div className="archive-series-nav">
                      <ArchiveDropdown
                        label="فصل"
                        value={selectedSeason == null ? "" : String(selectedSeason)}
                        options={groupedSeasons.length
                          ? [{ value: "", label: "انتخاب فصل" }, ...groupedSeasons.map((season) => ({ value: String(season.season), label: `فصل ${season.season}` }))]
                          : [{ value: "", label: "فصلی موجود نیست" }]}
                        onChange={(value) => {
                          const next = value ? Number(value) : null;
                          setSelectedSeason(next);
                          setSelectedEpisode(null);
                          if (next != null) {
                            setOpenSeasons((current) => current.includes(next) ? current : [...current, next]);
                          } else {
                            setOpenSeasons([]);
                          }
                        }}
                      />
                      <ArchiveDropdown
                        label="قسمت"
                        value={selectedEpisode == null ? "" : String(selectedEpisode)}
                        options={selectedSeason == null
                          ? [{ value: "", label: "ابتدا یک فصل را انتخاب کنید" }]
                          : (groupedSeasons.find((season) => season.season === selectedSeason)?.episodes ?? []).map((episode) => ({ value: String(episode.episode), label: `قسمت ${episode.episode}` }))}
                        onChange={(value) => setSelectedEpisode(Number(value))}
                        disabled={selectedSeason == null}
                      />
                    </div>
                    <div className="archive-series-list">
                      {groupedSeasons.filter((season) => selectedSeason == null || season.season === selectedSeason).map((season) => {
                        const open = openSeasons.includes(season.season);
                        return (
                          <section className={clsx("archive-season", open && "is-open")} key={season.season}>
                            <button type="button" className="archive-season__trigger" onClick={() => setOpenSeasons((current) => current.includes(season.season) ? current.filter((item) => item !== season.season) : [...current, season.season])}>
                              <span className="archive-season__title"><span className="archive-season__number">{season.season.toLocaleString("fa-IR")}</span><span><strong>فصل {season.season.toLocaleString("fa-IR")}</strong><small>{season.episodes.length.toLocaleString("fa-IR")} قسمت</small></span></span>
                              <TbChevronDown />
                            </button>
                            <div className="archive-season__content">
                              <div className="archive-episodes">
                                {season.episodes.filter((episode) => selectedEpisode == null || episode.episode === selectedEpisode).map((episode) => (
                                  <article className="archive-episode" key={episode.episode}>
                                    <div className="archive-episode__head">
                                      <div><span>قسمت {episode.episode.toLocaleString("fa-IR")}</span><strong>{episode.files.length.toLocaleString("fa-IR")} نسخه</strong></div>
                                      <span className="archive-episode__line" />
                                    </div>
                                    <div className="archive-episode__variants">
                                      {episode.files.map((file, index) => <FileVariantButton key={`${file.url}-${index}`} file={file} onSelect={() => selectFile(file)} />)}
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </div>
                          </section>
                        );
                      })}
                    </div>
                    {selectedSeason == null && <p className="archive-series-hint">ابتدا یک فصل را انتخاب کنید؛ سپس قسمت‌های همان فصل در منوی دوم در دسترس قرار می‌گیرند.</p>}
                    {selectedSeason != null && !groupedSeasons.some((season) => season.season === selectedSeason && season.episodes.length > 0) && <p className="archive-modal__empty archive-modal__empty--inline">برای این فصل قسمتی ثبت نشده است.</p>}
                  </section>
                ) : (
                  <section className="archive-section">
                    <div className="archive-section__heading"><div><span className="archive-section__eyebrow">نسخه‌های قابل پخش</span><h3>{detail.files?.length ?? 0} فایل</h3></div></div>
                    {detail.files?.length ? <div className="archive-files">{detail.files.map((file, index) => <FileVariantButton key={`${file.url}-${index}`} file={file} onSelect={() => selectFile(file)} />)}</div> : <p className="archive-modal__empty archive-modal__empty--inline">هیچ فایل قابل انتخابی برای این عنوان ثبت نشده است.</p>}
                  </section>
                )}

                {suggested.length > 0 && (
                  <section className="archive-section">
                    <div className="archive-section__heading"><div><span className="archive-section__eyebrow">پیشنهاد برای تماشا</span><h3>مرتبط با این عنوان</h3></div></div>
                    <div className="archive-related-grid">{suggested.map((item) => <MediaCard key={item.id} item={item} onClick={() => setSelectedId(item.id)} compact />)}</div>
                  </section>
                )}
              </>
            ) : <p className="archive-modal__empty">اطلاعات یافت نشد.</p>}
          </section>
        ) : (
          <section className="archive-list">
            <div className="archive-modal__controls">
              <div className="archive-modal__search"><TbSearch /><input type="search" data-video-keyboard-ignore placeholder="نام فارسی، انگلیسی یا IMDb ID..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
              <div className="archive-modal__filters">
                <ArchiveDropdown label="نوع" value={typeFilter} options={[{ value: "", label: "همه انواع" }, { value: "movie", label: "فیلم" }, { value: "series", label: "سریال" }]} onChange={(value) => { setTypeFilter(value); setPage(1); }} />
                <ArchiveDropdown label="مرتب‌سازی" value={sortBy} options={[{ value: "rates_desc", label: "امتیاز بیشتر" }, { value: "votes_desc", label: "رأی بیشتر" }, { value: "year_desc", label: "جدیدتر" }, { value: "title_asc", label: "عنوان" }]} onChange={(value) => { setSortBy(value); setPage(1); }} />
              </div>
            </div>

            {contextRelated.length > 0 && <section className="archive-section archive-section--context"><div className="archive-section__heading"><div><span className="archive-section__eyebrow"><TbSparkles /> پیشنهاد هوشمند</span><h3>بر اساس محتوای در حال پخش</h3></div></div><div className="archive-related-grid archive-related-grid--list">{contextRelated.map((item) => <MediaCard key={item.id} item={item} onClick={() => setSelectedId(item.id)} compact />)}</div></section>}

            {listQuery.isLoading ? <div className="archive-modal__loading"><TbLoader2 className="spinner" /><span>در حال دریافت آرشیو...</span></div> : mediaList.length > 0 ? <>
              <div className="archive-list__summary"><span>{listQuery.data?.total.toLocaleString("fa-IR")} عنوان</span><span>صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span></div>
              <div className="archive-modal__grid">{mediaList.map((item) => <MediaCard key={item.id} item={item} onClick={() => setSelectedId(item.id)} />)}</div>
              {totalPages > 1 && <div className="archive-modal__pagination"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><TbChevronRight /></button><span>صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}><TbChevronLeft /></button></div>}
            </> : <div className="archive-modal__empty"><TbInfoCircle /><span>هیچ عنوانی با این مشخصات پیدا نشد.</span></div>}
          </section>
        )}
      </div>
    </div>
  );
};

export default ArchiveModal;

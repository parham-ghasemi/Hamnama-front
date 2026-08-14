import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import {
  TbArchiveFilled,
  TbArrowRight,
  TbCheck,
  TbChevronLeft,
  TbChevronRight,
  TbCode,
  TbDeviceTv,
  TbExternalLink,
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

interface ArchiveModalProps {
  isOpen: boolean;
  closeModal: () => void;
  setLink: React.Dispatch<React.SetStateAction<string>>;
  setQuality: React.Dispatch<React.SetStateAction<string>>;
  currentPlaying?: string | null;
}

const typeLabel = (type?: string) => {
  if (type === "series") return "سریال";
  if (type === "movie") return "فیلم";
  return type || "نامشخص";
};

const safeJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
};

const clean = (value: unknown) => {
  if (value === null || value === undefined || value === "" || value === "N/A") return "—";
  return String(value);
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

const DataField: React.FC<{ label: string; value?: unknown; ltr?: boolean }> = ({ label, value, ltr }) => (
  <div className="archive-field">
    <span className="archive-field__label">{label}</span>
    <span className={clsx("archive-field__value", ltr && "ltr")}>{clean(value)}</span>
  </div>
);

const FileCard: React.FC<{
  file: MediaFileItem;
  onSelect: () => void;
}> = ({ file, onSelect }) => (
  <article className={clsx("archive-file", !file.valid && "archive-file--invalid")}>
    <div className="archive-file__topline">
      <div className="archive-file__badges">
        {file.season != null && <span className="archive-badge">فصل {file.season}</span>}
        {file.episode != null && <span className="archive-badge">قسمت {file.episode}</span>}
        {file.quality_tags && <span className="archive-badge">{file.quality_tags}</span>}
        {file.version && <span className="archive-badge">{file.version}</span>}
        {file.release && <span className="archive-badge">{file.release}</span>}
        <span className={clsx("archive-badge", file.valid ? "archive-badge--valid" : "archive-badge--invalid")}>
          {file.valid ? "معتبر" : "نامعتبر"}
        </span>
      </div>

      <button type="button" className="archive-file__select" onClick={onSelect} disabled={!file.url}>
        {file.valid ? <TbLink /> : <TbInfoCircle />}
        <span>انتخاب</span>
      </button>
    </div>

    <div className="archive-file__filename" dir="ltr" title={file.filename}>
      {file.filename || file.url}
    </div>

    <div className="archive-file__grid">
      <DataField label="حجم" value={file.size} />
      <DataField label="Content-Type" value={file.content_type} ltr />
      <DataField label="HTTP Status" value={file.status} />
      <DataField label="Season" value={file.season} />
      <DataField label="Episode" value={file.episode} />
      <DataField label="Quality Tags" value={file.quality_tags} />
      <DataField label="Version" value={file.version} />
      <DataField label="Release" value={file.release} />
      <DataField label="URL" value={file.url} ltr />
      <DataField label="Final URL" value={file.final_url} ltr />
      <DataField label="Error" value={file.error} />
    </div>

    {file.error && <p className="archive-file__error">{file.error}</p>}
  </article>
);

const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  closeModal,
  setLink,
  setQuality,
  currentPlaying,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    setSelectedId(null);
    closeModal();
  };

  const selectFile = (file: MediaFileItem) => {
    setLink(file.final_url || file.url);
    setQuality(file.quality_tags || file.version || "quality");
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
            <span>تمام اطلاعات موجود، لینک‌ها و نسخه‌های قابل پخش</span>
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
                <span>در حال دریافت اطلاعات کامل...</span>
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
                      {detail.rating && <span className="archive-pill archive-pill--rating"><TbStarFilled /> {detail.rating}</span>}
                      {detail.id && <span className="archive-pill archive-pill--mono">{detail.id}</span>}
                    </div>
                    <h1>{detail.title_en || detail.title_fa}</h1>
                    {detail.title_fa && detail.title_en && <h2>{detail.title_fa}</h2>}
                    <p className="archive-hero__plot">{clean(detail.plot || detail.omdb?.Plot)}</p>
                    <div className="archive-hero__quick">
                      <DataField label="IMDb Votes" value={detail.votes} />
                      <DataField label="Rated" value={detail.rated} />
                      <DataField label="Released" value={detail.released} />
                      <DataField label="Runtime" value={detail.runtime} />
                      <DataField label="Genre" value={detail.genre} />
                      <DataField label="Language" value={detail.language} />
                    </div>
                  </div>
                </section>

                {suggested.length > 0 && (
                  <section className="archive-section">
                    <div className="archive-section__heading">
                      <div>
                        <span className="archive-section__eyebrow">پیشنهاد برای تماشا</span>
                        <h3>{currentPlaying && !selectedId ? "بر اساس چیزی که الان در حال پخش است" : "مرتبط با این عنوان"}</h3>
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
                      <span className="archive-section__eyebrow">اطلاعات اصلی</span>
                      <h3>جزئیات اثر</h3>
                    </div>
                  </div>
                  <div className="archive-fields-grid">
                    <DataField label="IMDb ID" value={detail.id} ltr />
                    <DataField label="Type" value={detail.type} />
                    <DataField label="عنوان انگلیسی" value={detail.title_en} />
                    <DataField label="عنوان فارسی" value={detail.title_fa} />
                    <DataField label="Year" value={detail.year} />
                    <DataField label="Rating" value={detail.rating} />
                    <DataField label="Votes" value={detail.votes} />
                    <DataField label="Rated" value={detail.rated} />
                    <DataField label="Released" value={detail.released} />
                    <DataField label="Runtime" value={detail.runtime} />
                    <DataField label="Genre" value={detail.genre} />
                    <DataField label="Director" value={detail.director} />
                    <DataField label="Writer" value={detail.writer} />
                    <DataField label="Actors" value={detail.actors} />
                    <DataField label="Language" value={detail.language} />
                    <DataField label="Country" value={detail.country} />
                    <DataField label="Awards" value={detail.awards} />
                    <DataField label="Metascore" value={detail.metascore} />
                    <DataField label="Box Office" value={detail.box_office} />
                    <DataField label="IMDb Rating" value={detail.imdb_rating} />
                    <DataField label="IMDb Votes" value={detail.imdb_votes} />
                    <DataField label="Poster" value={detail.poster} ltr />
                    <DataField label="Plot" value={detail.plot} />
                  </div>
                </section>

                <section className="archive-section">
                  <div className="archive-section__heading">
                    <div>
                      <span className="archive-section__eyebrow">OMDb</span>
                      <h3>پاسخ کامل OMDb</h3>
                    </div>
                  </div>
                  {detail.omdb ? (
                    <div className="archive-fields-grid">
                      <DataField label="Title" value={detail.omdb.Title} />
                      <DataField label="Year" value={detail.omdb.Year} />
                      <DataField label="Rated" value={detail.omdb.Rated} />
                      <DataField label="Released" value={detail.omdb.Released} />
                      <DataField label="Runtime" value={detail.omdb.Runtime} />
                      <DataField label="Genre" value={detail.omdb.Genre} />
                      <DataField label="Director" value={detail.omdb.Director} />
                      <DataField label="Writer" value={detail.omdb.Writer} />
                      <DataField label="Actors" value={detail.omdb.Actors} />
                      <DataField label="Plot" value={detail.omdb.Plot} />
                      <DataField label="Language" value={detail.omdb.Language} />
                      <DataField label="Country" value={detail.omdb.Country} />
                      <DataField label="Awards" value={detail.omdb.Awards} />
                      <DataField label="Poster" value={detail.omdb.Poster} ltr />
                      <DataField label="Metascore" value={detail.omdb.Metascore} />
                      <DataField label="IMDb Rating" value={detail.omdb.imdbRating} />
                      <DataField label="IMDb Votes" value={detail.omdb.imdbVotes} />
                      <DataField label="IMDb ID" value={detail.omdb.imdbID} ltr />
                      <DataField label="Type" value={detail.omdb.Type} />
                      <DataField label="Box Office" value={detail.omdb.BoxOffice} />
                      <DataField label="Response" value={detail.omdb.Response} />
                      <DataField label="Error" value={detail.omdb.Error} />
                    </div>
                  ) : (
                    <p className="archive-modal__empty archive-modal__empty--inline">اطلاعات OMDb برای این عنوان موجود نیست.</p>
                  )}
                </section>

                <section className="archive-section">
                  <div className="archive-section__heading">
                    <div>
                      <span className="archive-section__eyebrow">Source data</span>
                      <h3>Links و Related خام</h3>
                    </div>
                  </div>
                  <div className="archive-json-grid">
                    <div className="archive-json-card">
                      <div className="archive-json-card__head"><TbCode /> links</div>
                      <pre>{safeJson(detail.links)}</pre>
                    </div>
                    <div className="archive-json-card">
                      <div className="archive-json-card__head"><TbCode /> related</div>
                      <pre>{safeJson(detail.related)}</pre>
                    </div>
                  </div>
                </section>

                <section className="archive-section">
                  <div className="archive-section__heading">
                    <div>
                      <span className="archive-section__eyebrow">Files</span>
                      <h3>{detail.files?.length ?? 0} فایل موجود</h3>
                    </div>
                  </div>
                  {detail.files?.length ? (
                    <div className="archive-files">
                      {detail.files.map((file, index) => (
                        <FileCard key={`${file.url}-${index}`} file={file} onSelect={() => selectFile(file)} />
                      ))}
                    </div>
                  ) : (
                    <p className="archive-modal__empty archive-modal__empty--inline">هیچ فایل قابل انتخابی برای این عنوان ثبت نشده است.</p>
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
                    <h3>چون این عنوان در حال پخش است</h3>
                  </div>
                  <span className="archive-context-url" dir="ltr">{currentPlaying}</span>
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
                    <span>صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
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

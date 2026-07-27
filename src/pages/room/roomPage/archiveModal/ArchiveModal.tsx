import React, { useState } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import {
  TbArchiveFilled,
  TbSearch,
  TbStarFilled,
  TbArrowRight,
  TbX,
  TbLink,
  TbMovie,
  TbChevronLeft,
  TbChevronRight,
  TbLoader2,
} from "react-icons/tb";
import { archiveApi } from "../../../../apiCalls/archiveApi";
import "./ArchiveModal.scss";

interface ArchiveModalProps {
  isOpen: boolean;
  closeModal: () => void;
  setLink: React.Dispatch<React.SetStateAction<string>>;
  setQuality: React.Dispatch<React.SetStateAction<string>>;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  closeModal,
  setLink,
  setQuality,
}) => {
  // Navigation State
  const [selectedImdbCode, setSelectedImdbCode] = useState<string | null>(null);

  // List Filter & Pagination State
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("rates_desc");
  const [page, setPage] = useState<number>(1);

  // 1. React Query: Fetch Media List
  const {
    data: listResponse,
    isLoading: loadingList,
  } = useQuery({
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
    enabled: isOpen && !selectedImdbCode,
  });

  const mediaList = listResponse?.data || [];
  const totalPages = listResponse?.totalPages || 1;

  // 2. React Query: Fetch Media Details
  const {
    data: mediaDetail,
    isLoading: loadingDetail,
  } = useQuery({
    queryKey: ["archiveMediaDetails", selectedImdbCode],
    queryFn: async () => {
      const response = await archiveApi.getMediaDetails(selectedImdbCode!);
      return response.data;
    },
    enabled: isOpen && !!selectedImdbCode,
  });

  // Reset navigation when closing
  const handleClose = () => {
    closeModal();
    setTimeout(() => {
      setSelectedImdbCode(null);
    }, 200);
  };

  const handleSelectLink = (fileUrl: string, quality: string | undefined) => {
    setLink(fileUrl);
    if (!!quality) setQuality(quality)
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={clsx("archive-modal", isOpen && "open")}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="archive-modal__head">
        <div className="archive-modal__head-title">
          <TbArchiveFilled />
          <span>آرشیو فیلم و سریال</span>
        </div>
        <button className="archive-modal__close-btn" onClick={handleClose}>
          <TbX />
        </button>
      </div>

      {/* Body */}
      <div className="archive-modal__body">
        {selectedImdbCode ? (
          /* --- DETAIL VIEW --- */
          <div className="archive-modal__detail-view">
            <button
              className="archive-modal__back-btn"
              onClick={() => setSelectedImdbCode(null)}
            >
              <TbArrowRight />
              <span>بازگشت به لیست</span>
            </button>

            {loadingDetail ? (
              <div className="archive-modal__loading">
                <TbLoader2 className="spinner" />
                <span>در حال دریافت اطلاعات...</span>
              </div>
            ) : mediaDetail ? (
              <div className="archive-modal__detail-content">
                <div className="archive-modal__detail-header">
                  {mediaDetail.image ? (
                    <img
                      src={mediaDetail.image}
                      alt={mediaDetail.title}
                      className="archive-modal__detail-poster"
                    />
                  ) : (
                    <div className="archive-modal__detail-poster-fallback">
                      <TbMovie />
                    </div>
                  )}

                  <div className="archive-modal__detail-info">
                    <h2>{mediaDetail.title}</h2>
                    <div className="archive-modal__detail-meta">
                      <span className="badge type">{mediaDetail.titleType}</span>
                      <span className="badge rating">
                        <TbStarFilled /> {mediaDetail.imdbRates}
                      </span>
                      <span className="votes">
                        ({mediaDetail.imdbVotes.toLocaleString()} رای)
                      </span>
                    </div>
                    {mediaDetail.genre && (
                      <div className="archive-modal__detail-genres">
                        {mediaDetail.genre.split(",").map((g, idx) => (
                          <span key={idx} className="genre-tag">
                            {g.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {mediaDetail.description && (
                      <p className="archive-modal__detail-desc">
                        {mediaDetail.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Available Versions / Downloads */}
                <div className="archive-modal__versions">
                  <h3>نسخه‌ها و لینک‌های دانلود</h3>
                  {mediaDetail.versions && mediaDetail.versions.length > 0 ? (
                    <div className="archive-modal__versions-list">
                      {mediaDetail.versions.map((version) => (
                        <div
                          key={version.id}
                          className="archive-modal__version-card"
                        >
                          <div className="archive-modal__version-meta">
                            {version.season && (
                              <span className="version-badge season">
                                فصل {version.season}
                              </span>
                            )}
                            {version.quality && (
                              <span className="version-badge quality">
                                {version.quality}
                              </span>
                            )}
                            {version.subType && (
                              <span className="version-badge sub-type">
                                {version.subType}
                              </span>
                            )}
                            {version.size && (
                              <span className="version-size">
                                {version.size}
                              </span>
                            )}
                          </div>

                          <button
                            className="archive-modal__select-btn"
                            onClick={() => handleSelectLink(version.fileUrl, version.quality)}
                          >
                            <TbLink />
                            <span>انتخاب لینک</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="archive-modal__empty">
                      هیچ لینکی برای این عنوان یافت نشد.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="archive-modal__empty">اطلاعات یافت نشد.</p>
            )}
          </div>
        ) : (
          /* --- GRID LIST VIEW --- */
          <div className="archive-modal__list-view">
            {/* Filter Controls */}
            <div className="archive-modal__controls">
              <div className="archive-modal__search">
                <TbSearch />
                <input
                  type="text"
                  placeholder="جستجوی نام فیلم یا سریال..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="archive-modal__filters">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">همه انواع</option>
                  <option value="movie">فیلم</option>
                  <option value="series">سریال</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rates_desc">امتیاز (زیاد به کم)</option>
                  <option value="votes_desc">تعداد رای (زیاد به کم)</option>
                  <option value="title_asc">عنوان (الفبا)</option>
                </select>
              </div>
            </div>

            {/* Cards Grid */}
            {loadingList ? (
              <div className="archive-modal__loading">
                <TbLoader2 className="spinner" />
                <span>در حال دریافت لیست آرشیو...</span>
              </div>
            ) : mediaList.length > 0 ? (
              <>
                <div className="archive-modal__grid">
                  {mediaList.map((item) => (
                    <div
                      key={item.imdbCode}
                      className="archive-card"
                      onClick={() => setSelectedImdbCode(item.imdbCode)}
                    >
                      <div className="archive-card__poster-wrapper">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="archive-card__poster"
                            loading="lazy"
                          />
                        ) : (
                          <div className="archive-card__poster-fallback">
                            <TbMovie />
                          </div>
                        )}
                        <div className="archive-card__rating">
                          <TbStarFilled />
                          <span>{item.imdbRates}</span>
                        </div>
                      </div>

                      <div className="archive-card__info">
                        <h4 className="archive-card__title">{item.title}</h4>
                        <span className="archive-card__type">
                          {item.titleType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="archive-modal__pagination">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <TbChevronRight />
                    </button>
                    <span>
                      صفحه {page} از {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <TbChevronLeft />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="archive-modal__empty">
                هیچ موردی با این مشخصات یافت نشد.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveModal;
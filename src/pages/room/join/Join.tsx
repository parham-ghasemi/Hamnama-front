import { BsPlusLg } from 'react-icons/bs';
import Header from '../../../components/header/Header';
import './Join.scss';
import { IoCopyOutline } from 'react-icons/io5';
import { PiFilmSlateFill, PiUsersThreeFill, PiClockCounterClockwiseFill, PiPlayFill, PiTrashSimpleFill, PiSpinner, PiImageSquareFill, PiMagnifyingGlass, PiCaretDownBold, PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';
import CreateRoomModal from './createRoomModal/CreateRoomModal';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { clearRoomData, getCurrentRoom, getLastActiveRoom, getRoomApiErrorStatus, joinRoom, listPublicRooms, type PublicRoomSort } from '../../../apiCalls/roomApi';
import { useNavigate } from 'react-router-dom';
import Skeleton from "../../../components/skeleton/Skeleton";
// import { useAuth } from '../../../context/AuthContext';
import { FaCheck } from 'react-icons/fa6';
import clsx from 'clsx';
import { toast } from '../../../components/toast';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';


const Join = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState<number | string>("");
  const [publicRoomSearch, setPublicRoomSearch] = useState("");
  const [publicRoomSearchTerm, setPublicRoomSearchTerm] = useState("");
  const [publicRoomSort, setPublicRoomSort] = useState<PublicRoomSort>("newest");
  const [publicRoomPage, setPublicRoomPage] = useState(1);
  const [isPublicRoomSortOpen, setIsPublicRoomSortOpen] = useState(false);
  const publicRoomSortRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const { openConfirmation } = useConfirmationModal();

  // const { isAuthenticated } = useAuth();
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     nav('/');
  //   }
  // }, [])


  const currentRoomQuery = useQuery({
    queryKey: ["current-room"],
    queryFn: getCurrentRoom,
    retry: (failureCount, error) => {
      const status = getRoomApiErrorStatus(error);
      return status !== 404 && status !== 410 && failureCount < 2;
    },
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPublicRoomSearchTerm(publicRoomSearch.trim());
      setPublicRoomPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [publicRoomSearch]);

  useEffect(() => {
    setPublicRoomPage(1);
  }, [publicRoomSort]);

  useEffect(() => {
    if (!isPublicRoomSortOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!publicRoomSortRef.current?.contains(event.target as Node)) {
        setIsPublicRoomSortOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPublicRoomSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPublicRoomSortOpen]);

  const publicRoomsQuery = useQuery({
    queryKey: ["public-rooms", publicRoomSearchTerm, publicRoomSort, publicRoomPage],
    queryFn: () => listPublicRooms({
      search: publicRoomSearchTerm,
      sort: publicRoomSort,
      page: publicRoomPage,
    }),
    staleTime: 15_000,
  });

  useEffect(() => {
    const totalPages = publicRoomsQuery.data?.total_pages ?? 0;

    if (totalPages > 0 && publicRoomPage > totalPages) {
      setPublicRoomPage(totalPages);
    } else if (totalPages === 0 && publicRoomPage !== 1) {
      setPublicRoomPage(1);
    }
  }, [publicRoomsQuery.data?.total_pages, publicRoomPage]);

  const lastRoomQuery = useQuery({
    queryKey: ["last-active-room"],
    queryFn: getLastActiveRoom,
    retry: (failureCount, error) => {
      const status = getRoomApiErrorStatus(error);
      return status !== 404 && status !== 410 && failureCount < 2;
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: (roomCode: number) => joinRoom(roomCode),
    onSuccess: (data) => {
      nav(`/room/${data.id}`);
    },
    onError: (error) => {
      if (getRoomApiErrorStatus(error) === 409) {
        toast.error("امکان ورود به اتاق وجود ندارد", {
          description:
            "شما در حال حاضر داخل یک اتاق هستید. ابتدا از آن اتاق خارج شوید و سپس دوباره تلاش کنید.",
        });
        return;
      }

      toast.error("پیوستن به اتاق با خطا مواجه شد", {
        description:
          "کد اتاق را بررسی کنید و دوباره تلاش کنید.",
      });

      console.error("Failed to join room:", error);
    },
  });

  const joinLastRoomMutation = useMutation({
    mutationFn: (roomCode: number) => joinRoom(roomCode),
    onSuccess: (data) => {
      nav(`/room/${data.id}`);
    },
    onError: (error) => {
      if (getRoomApiErrorStatus(error) === 409) {
        toast.error("امکان ورود به اتاق وجود ندارد", {
          description:
            "شما در حال حاضر داخل یک اتاق هستید. ابتدا از آن اتاق خارج شوید و سپس دوباره تلاش کنید.",
        });
        return;
      }

      toast.error("بازگشت به اتاق با خطا مواجه شد", {
        description: "لطفاً دوباره تلاش کنید.",
      });

      console.error("Failed to join last active room:", error);
    },
  });

  const clearRoomDataMutation = useMutation({
    mutationFn: (roomId: string) => clearRoomData(roomId),
    onSuccess: async () => {
      await Promise.all([currentRoomQuery.refetch(), lastRoomQuery.refetch()]);
      toast.success("اطلاعات اتاق پاک شد", {
        description: "پیام‌ها، وضعیت پخش و سایر داده‌های اتاق حذف شدند.",
      });
      location.reload()
    },
    onError: (error) => {
      if (getRoomApiErrorStatus(error) === 403) {
        toast.error("دسترسی مجاز نیست", {
          description: "فقط سازنده اتاق می‌تواند اطلاعات آن را پاک کند.",
        });
        return;
      }

      toast.error("پاک کردن اطلاعات اتاق با خطا مواجه شد", {
        description: "لطفاً دوباره تلاش کنید.",
      });
      console.error("Failed to clear room data:", error);
    },
  });

  const handleJoin = () => {
    const roomCode = Number(code);
    if (!Number.isInteger(roomCode) || roomCode <= 0 || joinRoomMutation.isPending) return;

    joinRoomMutation.mutate(roomCode);
  };

  const handleClearRoomData = () => {
    if (!activeRoom || clearRoomDataMutation.isPending) return;

    openConfirmation({
      title: "آیا از پاک کردن این اتاق مطمئن هستید؟",
      body: "تمام پیام‌های چت، وضعیت و رسانه در حال پخش و سایر اطلاعات ذخیره‌شده این اتاق برای همیشه حذف می‌شوند.",
      primaryButtonText: "پاک کردن",
      secondaryButtonText: "انصراف",
      primaryButtonClasses: "confirm-modal__primary--danger",
      onConfirm: () => clearRoomDataMutation.mutateAsync(activeRoom.id),
    });
  };

  const handleCopy = () => {
    if (activeRoom) {
      navigator.clipboard.writeText(String(activeRoom.code))
      setCopied(true)

      setInterval(() => {
        setCopied(false);
      }, 4000);
    }
  }

  const activeRoom = currentRoomQuery.data ?? null;

  useEffect(() => {
    if (activeRoom) setIsModalOpen(false);
  }, [activeRoom]);

  const activeRoomLoading = currentRoomQuery.isLoading || currentRoomQuery.isFetching;
  const activeRoomLookupFailed = !!currentRoomQuery.error && getRoomApiErrorStatus(currentRoomQuery.error) !== 404;
  const createRoomDisabled = activeRoomLoading || !!activeRoom || activeRoomLookupFailed;
  const lastRoom = lastRoomQuery.data ?? null;
  const lastRoomLabel = lastRoom?.created_by_name || "آخرین اتاق شما";
  const publicRooms = publicRoomsQuery.data?.rooms ?? [];
  const publicRoomTotalPages = publicRoomsQuery.data?.total_pages ?? 0;
  const publicRoomSortLabels: Record<PublicRoomSort, string> = {
    newest: "جدیدترین",
    oldest: "قدیمی‌ترین",
    most_users: "بیشترین کاربر",
    least_users: "کمترین کاربر",
    name: "نام اتاق",
  };

  const getPublicRoomPaginationItems = () => {
    if (publicRoomTotalPages <= 7) {
      return Array.from({ length: publicRoomTotalPages }, (_, index) => index + 1) as Array<number | "left-ellipsis" | "right-ellipsis">;
    }

    if (publicRoomPage <= 4) {
      return [1, 2, 3, 4, 5, "right-ellipsis", publicRoomTotalPages] as Array<number | "left-ellipsis" | "right-ellipsis">;
    }

    if (publicRoomPage >= publicRoomTotalPages - 3) {
      return [1, "left-ellipsis", publicRoomTotalPages - 4, publicRoomTotalPages - 3, publicRoomTotalPages - 2, publicRoomTotalPages - 1, publicRoomTotalPages] as Array<number | "left-ellipsis" | "right-ellipsis">;
    }

    return [1, "left-ellipsis", publicRoomPage - 1, publicRoomPage, publicRoomPage + 1, "right-ellipsis", publicRoomTotalPages] as Array<number | "left-ellipsis" | "right-ellipsis">;
  };

  return (
    <div className='join-page'>
      <Header />
      <div className="join-page__content">
        <div className="join-page__content__main">
          <div className="join-page__content__main__blob" />
          <div className="join-page__content__main__inner">
            <div className="join-page__content__main__intro">
              <h1 className="join-page__content__main__intro__title">
                یک <span>اتاق سینمایی</span> انتخاب کنید
              </h1>
              <p className="join-page__content__main__intro__sub">
                وارد اتاق شخصی خود شوید، به اتاق دوستانتان بپیوندید یا اتاق تازه‌ای بسازید.
              </p>
            </div>

            <div className="join-page__content__main__cards">
              <div className="join-page__content__main__cards__card">
                <span className="join-page__content__main__cards__card__badge" aria-hidden="true">
                  <PiFilmSlateFill />
                </span>

                <button className={clsx("join-page__content__main__cards__card__del", clearRoomDataMutation.isPending && "pending")}
                  disabled={!activeRoom || activeRoomLoading || clearRoomDataMutation.isPending}
                  onClick={handleClearRoomData}>
                  {clearRoomDataMutation.isPending ? <PiSpinner /> : <PiTrashSimpleFill />}
                </button>

                <h4>اتاق شخصی</h4>
                <div className="join-page__content__main__cards__card__i">
                  <span className="join-page__content__main__cards__card__i__screen" aria-hidden="true">
                    <PiPlayFill />
                  </span>
                </div>
                <div className={clsx("join-page__content__main__cards__card__code", copied && 'copied')}>
                  کد شما:
                  <code>
                    {currentRoomQuery.isLoading ? (
                      <Skeleton variant="text" width={74} height={24} />
                    ) : activeRoom ? (
                      activeRoom.code.toLocaleString("fa-IR").replace('٬', "")
                    ) : (
                      "---"
                    )}
                  </code>
                  <span onClick={handleCopy} aria-hidden={!activeRoom} >
                    {copied ? (<FaCheck />) : (<IoCopyOutline />)}
                  </span>
                </div>

                <button className="join-page__content__main__cards__card__enter" disabled={!activeRoom || activeRoomLoading} onClick={() => activeRoom && nav(`/room/${activeRoom.id}`)} >
                  ورود
                </button>
              </div>

              <div className="join-page__content__main__cards__card">
                <span className="join-page__content__main__cards__card__badge" aria-hidden="true">
                  <PiUsersThreeFill />
                </span>

                <h4>تماشا با دیگران</h4>

                <div className="join-page__content__main__cards__card__i">
                  <span className="join-page__content__main__cards__card__i__screen" aria-hidden="true">
                    <PiUsersThreeFill />
                  </span>
                </div>

                <div className="join-page__content__main__cards__card__code__wrapper">
                  <input className="join-page__content__main__cards__card__code" type='text' placeholder='کد اتاق' value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
                  <span onClick={() => navigator.clipboard.writeText(String(code))}>
                    <IoCopyOutline />
                  </span>
                </div>
                <button
                  className="join-page__content__main__cards__card__enter"
                  onClick={handleJoin}
                  disabled={joinRoomMutation.isPending}
                >
                  {joinRoomMutation.isPending ? "در حال ورود..." : "پیوستن"}
                </button>
              </div>

              <div className="join-page__content__main__cards__last">
                <span className="join-page__content__main__cards__last__icon" aria-hidden="true">
                  <PiClockCounterClockwiseFill />
                </span>

                <div className="join-page__content__main__cards__last__info">
                  <p className="join-page__content__main__cards__last__info__label">آخرین اتاق شما</p>
                  <p className="join-page__content__main__cards__last__info__name">
                    {lastRoomQuery.isLoading ? (
                      <Skeleton variant="text" width={150} height={18} />
                    ) : lastRoom ? (
                      <>
                        {lastRoomLabel}
                        <span className="join-page__content__main__cards__last__info__code">
                          {lastRoom.code.toLocaleString("fa-IR").replace('٬', "")}
                        </span>
                      </>
                    ) : (
                      "اتاقی برای بازگشت وجود ندارد"
                    )}
                  </p>
                </div>

                <button
                  className="join-page__content__main__cards__last__action"
                  type="button"
                  disabled={!lastRoom || joinLastRoomMutation.isPending || lastRoomQuery.isLoading}
                  onClick={() => lastRoom && joinLastRoomMutation.mutate(lastRoom.code)}
                >
                  {joinLastRoomMutation.isPending ? "در حال ورود..." : lastRoomQuery.isLoading ? "در حال بارگذاری..." : "بازگشت به اتاق"}
                </button>
              </div>

              <div
                className={`join-page__content__main__cards__card--create${createRoomDisabled ? " is-disabled" : ""}`}
                role="button"
                tabIndex={createRoomDisabled ? -1 : 0}
                aria-disabled={createRoomDisabled}
                onClick={() => !createRoomDisabled && setIsModalOpen(true)}
                onKeyDown={(event) => {
                  if (!createRoomDisabled && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    setIsModalOpen(true);
                  }
                }}
              >
                <p>{activeRoomLoading ? "در حال بررسی اتاق..." : "ساخت اتاق شخصی"}</p>
                <span><BsPlusLg strokeWidth={1} /></span>
              </div>
            </div>

            <section className="join-page__public-rooms" aria-labelledby="public-rooms-title">
              <div className="join-page__public-rooms__head">
                <div>
                  <p className="join-page__public-rooms__eyebrow">اتاق‌های عمومی</p>
                  <h2 id="public-rooms-title">به جمع دیگران بپیوندید</h2>
                  <span>اتاق‌های عمومی فعال را جست‌وجو، مرتب و مستقیم انتخاب کنید.</span>
                </div>
                <PiUsersThreeFill aria-hidden="true" />
              </div>

              <div className="join-page__public-rooms__controls">
                <label className="join-page__public-rooms__search">
                  <PiMagnifyingGlass aria-hidden="true" />
                  <input
                    type="search"
                    value={publicRoomSearch}
                    onChange={(event) => setPublicRoomSearch(event.target.value)}
                    placeholder="جست‌وجوی نام اتاق یا سازنده..."
                    aria-label="جست‌وجوی اتاق‌های عمومی"
                  />
                </label>

                <div className="join-page__public-rooms__sort" ref={publicRoomSortRef}>
                  <button
                    type="button"
                    className="join-page__public-rooms__sort__trigger"
                    aria-haspopup="listbox"
                    aria-expanded={isPublicRoomSortOpen}
                    onClick={() => setIsPublicRoomSortOpen((open) => !open)}
                  >
                    <span>مرتب‌سازی: {publicRoomSortLabels[publicRoomSort]}</span>
                    <PiCaretDownBold aria-hidden="true" />
                  </button>

                  {isPublicRoomSortOpen && (
                    <div className="join-page__public-rooms__sort__menu" role="listbox" aria-label="مرتب‌سازی اتاق‌ها">
                      {(Object.keys(publicRoomSortLabels) as PublicRoomSort[]).map((sort) => (
                        <button
                          key={sort}
                          type="button"
                          role="option"
                          aria-selected={publicRoomSort === sort}
                          className={clsx(
                            "join-page__public-rooms__sort__option",
                            publicRoomSort === sort && "is-selected",
                          )}
                          onClick={() => {
                            setPublicRoomSort(sort);
                            setIsPublicRoomSortOpen(false);
                          }}
                        >
                          {publicRoomSortLabels[sort]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {publicRoomsQuery.isLoading ? (
                <div className="join-page__public-rooms__grid" aria-busy="true">
                  {Array.from({ length: 3 }, (_, index) => index).map((index) => (
                    <article key={index} className="join-page__public-room-card join-page__public-room-card--skeleton">
                      <div className="join-page__public-room-card__title-row">
                        <Skeleton variant="text" width={index % 2 === 0 ? 128 : 96} height={18} />
                      </div>
                      <div className="join-page__public-room-card__meta">
                        <Skeleton variant="text" width={120} height={14} />
                        <Skeleton variant="text" width={70} height={14} />
                      </div>
                      <div className="join-page__public-room-card__image">
                        <Skeleton variant="rect" width="100%" height="100%" radius={16} />
                      </div>
                      <div className="join-page__public-room-card__code">
                        <span>کد اتاق</span>
                        <Skeleton variant="text" width={58} height={18} />
                      </div>
                      <Skeleton variant="rect" width="100%" height={42} radius={12} />
                    </article>
                  ))}
                </div>
              ) : publicRooms.length ? (
                <>
                  <div className="join-page__public-rooms__grid">
                    {publicRooms.map((room) => (
                      <article key={room.id} className="join-page__public-room-card">
                        <div className="join-page__public-room-card__title-row">
                          <h3 title={room.name}>{room.name}</h3>
                        </div>

                        <div className="join-page__public-room-card__image">
                          {room.image ? (
                            <img src={`${import.meta.env.VITE_BASE_URL ?? ""}${room.image}`} alt="" />
                          ) : (
                            <span className="join-page__public-room-card__image__placeholder" aria-hidden="true">
                              <PiImageSquareFill />
                            </span>
                          )}
                        </div>
                        <div className="join-page__public-room-card__code">
                          <span>کد اتاق</span>
                          <code>{room.code.toLocaleString("fa-IR").replace("٬", "")}</code>
                        </div>
                        <button
                          type="button"
                          className="join-page__public-room-card__join"
                          disabled={joinRoomMutation.isPending}
                          onClick={() => joinRoomMutation.mutate(room.code)}
                        >
                          {joinRoomMutation.isPending ? "در حال ورود..." : "پیوستن"}
                        </button>
                      </article>
                    ))}
                  </div>

                  {publicRoomTotalPages > 1 && (
                    <nav className="join-page__public-rooms__pagination" aria-label="صفحه‌بندی اتاق‌های عمومی">
                      <button
                        type="button"
                        className="join-page__public-rooms__pagination__arrow"
                        disabled={publicRoomPage === 1}
                        onClick={() => setPublicRoomPage((page) => Math.max(1, page - 1))}
                        aria-label="صفحه قبلی"
                      >
                        <PiCaretRightBold aria-hidden="true" />
                      </button>

                      <div className="join-page__public-rooms__pagination__pages">
                        {getPublicRoomPaginationItems().map((item, index) => (
                          typeof item === "number" ? (
                            <button
                              key={item}
                              type="button"
                              className={clsx(
                                "join-page__public-rooms__pagination__page",
                                publicRoomPage === item && "is-active",
                              )}
                              aria-current={publicRoomPage === item ? "page" : undefined}
                              onClick={() => setPublicRoomPage(item)}
                            >
                              {item.toLocaleString("fa-IR")}
                            </button>
                          ) : (
                            <span key={`${item}-${index}`} className="join-page__public-rooms__pagination__ellipsis" aria-hidden="true">
                              …
                            </span>
                          )
                        ))}
                      </div>

                      <button
                        type="button"
                        className="join-page__public-rooms__pagination__arrow"
                        disabled={publicRoomPage >= publicRoomTotalPages}
                        onClick={() => setPublicRoomPage((page) => Math.min(publicRoomTotalPages, page + 1))}
                        aria-label="صفحه بعدی"
                      >
                        <PiCaretLeftBold aria-hidden="true" />
                      </button>
                    </nav>
                  )}
                </>
              ) : (
                <div className="join-page__public-rooms__empty">
                  {publicRoomSearchTerm ? "نتیجه‌ای برای جست‌وجوی شما پیدا نشد." : "در حال حاضر اتاق عمومی فعالی وجود ندارد."}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default Join

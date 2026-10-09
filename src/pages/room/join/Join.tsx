import Header from '../../../components/header/Header';
import './Join.scss';
import { IoChevronBackOutline, IoChevronDownOutline, IoChevronForwardOutline, IoCopyOutline } from 'react-icons/io5';
import { PiFilmSlateFill, PiUsersThreeFill, PiClockCounterClockwiseFill, PiPlayFill, PiTrashSimpleFill, PiSpinner, PiImageSquareFill } from 'react-icons/pi';
import CreateRoomModal from './createRoomModal/CreateRoomModal';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { clearRoomData, getCurrentRoom, getLastActiveRoom, getRoomApiErrorStatus, joinRoom, listPublicRooms, type PublicRoomResponse, type PublicRoomSort } from '../../../apiCalls/roomApi';
import { useNavigate } from 'react-router-dom';
import Skeleton from "../../../components/skeleton/Skeleton";
// import { useAuth } from '../../../context/AuthContext';
import { FaCheck } from 'react-icons/fa6';
import clsx from 'clsx';
import { toast } from '../../../components/toast';
import { useConfirmationModal } from '../../../context/ConfirmModalContext/ConfirmaModalContext';
import { FaSearch } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { billingApi, type PrivatePlanRoom } from '../../../apiCalls/billingApi';
import { toEnglishNumerals } from '../../../helpers/NumberConversion';


const Join = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState<number | string>("");
  const [publicRoomSearch, setPublicRoomSearch] = useState("");
  const [submittedPublicRoomSearch, setSubmittedPublicRoomSearch] = useState("");
  const [publicRoomSort, setPublicRoomSort] = useState<PublicRoomSort>("newest");
  const [publicRoomPage, setPublicRoomPage] = useState(1);
  const [isPublicRoomSortOpen, setIsPublicRoomSortOpen] = useState(false);
  const publicRoomSortRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const { openConfirmation } = useConfirmationModal();
  const { user } = useAuth();
  const billingConfigQuery = useQuery({ queryKey: ['billing-public'], queryFn: () => billingApi.getPublicConfig().then(r => r.data), staleTime: 30_000 });
  const roomsEnabled = !!user && !billingConfigQuery.isLoading && !(billingConfigQuery.data?.is_paid === true && !user.current_plan);
  const paidLocked = billingConfigQuery.data?.is_paid === true && !!user && !user.current_plan;
  const privateRoomsQuery = useQuery({ queryKey: ['private-plan-rooms'], queryFn: () => billingApi.getPrivateRooms().then(r => r.data), enabled: roomsEnabled && !!user?.current_plan && billingConfigQuery.data?.is_paid === true, staleTime: 10_000 });

  // const { isAuthenticated } = useAuth();
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     nav('/');
  //   }
  // }, [])


  const currentRoomQuery = useQuery({
    queryKey: ["current-room"],
    queryFn: getCurrentRoom,
    enabled: roomsEnabled,
    retry: (failureCount, error) => {
      const status = getRoomApiErrorStatus(error);
      return status !== 404 && status !== 410 && failureCount < 2;
    },
  });

  useEffect(() => {
    setPublicRoomPage(1);
  }, [submittedPublicRoomSearch, publicRoomSort]);

  const handlePublicRoomSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedPublicRoomSearch(publicRoomSearch.trim());
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (publicRoomSortRef.current && !publicRoomSortRef.current.contains(event.target as Node)) {
        setIsPublicRoomSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const publicRoomsQuery = useQuery({
    queryKey: ["public-rooms", submittedPublicRoomSearch, publicRoomSort, publicRoomPage],
    queryFn: () => listPublicRooms({
      search: submittedPublicRoomSearch,
      sort: publicRoomSort,
      page: publicRoomPage,
    }),
    staleTime: 15_000,
    enabled: roomsEnabled,
  });

  useEffect(() => {
    if (publicRoomsQuery.data && publicRoomsQuery.data.page !== publicRoomPage) {
      setPublicRoomPage(publicRoomsQuery.data.page);
    }
  }, [publicRoomsQuery.data, publicRoomPage]);

  const lastRoomQuery = useQuery({
    queryKey: ["last-active-room"],
    queryFn: getLastActiveRoom,
    enabled: roomsEnabled,
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
      if (getRoomApiErrorStatus(error) === 402) {
        toast.error('برای ورود به اتاق اشتراک فعال لازم است', { description: 'یک پلن انتخاب کنید تا امکان ساخت و ورود به اتاق فعال شود.' });
        return;
      }
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
    if (!user) { nav(`/auth?redirect=${encodeURIComponent('/join-room')}`); return; }
    if (paidLocked) { toast.error('ابتدا یک پلن فعال تهیه کنید'); return; }
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
  const lastRoom = lastRoomQuery.data ?? null;
  const lastRoomLabel = lastRoom?.created_by_name || "آخرین اتاق شما";

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

            {paidLocked && (
              <div className="join-page__plan-gate">
                <div>
                  <strong>برای استفاده از اتاق‌ها اشتراک فعال لازم است</strong>
                  <span>در حالت پولی، ساختن و پیوستن به اتاق فقط برای اعضای پلن فعال امکان‌پذیر است.</span>
                </div>
                <button type="button" onClick={() => nav('/plan-details')}>مشاهده پلن‌ها</button>
              </div>
            )}

            <div className="join-page__content__main__cards">
              <div className="join-page__content__main__cards__card">
                <span className="join-page__content__main__cards__card__badge" aria-hidden="true">
                  <PiFilmSlateFill />
                </span>

                <button className={clsx("join-page__content__main__cards__card__del", clearRoomDataMutation.isPending && "pending")}
                  disabled={paidLocked || !activeRoom || activeRoomLoading || clearRoomDataMutation.isPending}
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

                <button
                  className="join-page__content__main__cards__card__enter"
                  disabled={paidLocked || activeRoomLoading || (!activeRoom && activeRoomLookupFailed)}
                  onClick={() => {
                    if (activeRoom) {
                      nav(`/room/${activeRoom.id}`);
                      return;
                    }

                    setIsModalOpen(true);
                  }}
                >
                  {activeRoomLoading ? "در حال بررسی..." : activeRoom ? "ورود" : "ساخت اتاق شخصی"}
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
                  <input className="join-page__content__main__cards__card__code" type='text' placeholder='کد اتاق' value={code} onChange={(e) => setCode(() => toEnglishNumerals(e.target.value))} maxLength={6} />
                  <span onClick={() => navigator.clipboard.writeText(String(code))}>
                    <IoCopyOutline />
                  </span>
                </div>
                <button
                  className="join-page__content__main__cards__card__enter"
                  onClick={handleJoin}
                  disabled={paidLocked || joinRoomMutation.isPending}
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
                  disabled={paidLocked || !lastRoom || joinLastRoomMutation.isPending || lastRoomQuery.isLoading}
                  onClick={() => lastRoom && joinLastRoomMutation.mutate(lastRoom.code)}
                >
                  {joinLastRoomMutation.isPending ? "در حال ورود..." : lastRoomQuery.isLoading ? "در حال بارگذاری..." : "بازگشت به اتاق"}
                </button>
              </div>

            </div>

            {roomsEnabled && privateRoomsQuery.data?.rooms?.length ? (
              <section className="join-page__private-rooms" aria-labelledby="private-rooms-title">
                <div className="join-page__private-rooms__head">
                  <div>
                    <p>اتاق‌های خصوصی پلن شما</p>
                    <h2 id="private-rooms-title">اولویت با دوستان شما</h2>
                    <span>فقط اعضای همین پلن می‌توانند این اتاق‌ها را ببینند و وارد شوند.</span>
                  </div>
                  <PiUsersThreeFill aria-hidden="true" />
                </div>
                <div className="join-page__private-rooms__grid">
                  {privateRoomsQuery.data.rooms.map((room: PrivatePlanRoom) => (
                    <article className="join-page__private-room-card" key={room.id}>
                      <div className="join-page__private-room-card__image">
                        {room.image ? <img src={`${import.meta.env.VITE_BASE_URL ?? ''}${room.image}`} alt="" /> : <PiImageSquareFill />}
                      </div>
                      <div className="join-page__private-room-card__body"><strong>{room.name}</strong><span>سازنده: {room.creator_username}</span><span>{room.member_count.toLocaleString('fa-IR')} نفر</span></div>
                      <button type="button" disabled={joinRoomMutation.isPending} onClick={() => joinRoomMutation.mutate(room.code)}>{joinRoomMutation.isPending ? 'در حال ورود...' : 'ورود به اتاق'}</button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="join-page__public-rooms" aria-labelledby="public-rooms-title">
              <div className="join-page__public-rooms__head">
                <div>
                  <p className="join-page__public-rooms__eyebrow">اتاق‌های عمومی</p>
                  <h2 id="public-rooms-title">به جمع دیگران بپیوندید</h2>
                  <span>اتاق‌های عمومی فعال را مستقیم انتخاب و وارد شوید.</span>
                </div>
                <PiUsersThreeFill aria-hidden="true" />
              </div>

              <div className="join-page__public-rooms__toolbar">
                <form className="join-page__public-rooms__search" onSubmit={handlePublicRoomSearchSubmit}>
                  <input
                    type="search"
                    value={publicRoomSearch}
                    onChange={(event) => setPublicRoomSearch(event.target.value)}
                    placeholder="جست‌وجوی نام اتاق یا سازنده..."
                    aria-label="جست‌وجوی اتاق‌های عمومی"
                  />
                  <button type="submit" aria-label="جست‌وجو">
                    <FaSearch />
                  </button>
                </form>

                <div className="join-page__public-rooms__sort" ref={publicRoomSortRef}>
                  <button
                    type="button"
                    className={clsx(
                      "join-page__public-rooms__sort__trigger",
                      isPublicRoomSortOpen && "is-open",
                    )}
                    aria-haspopup="listbox"
                    aria-expanded={isPublicRoomSortOpen}
                    onClick={() => setIsPublicRoomSortOpen((open) => !open)}
                  >
                    <span>{publicRoomSort === "newest" ? "جدیدترین" : publicRoomSort === "oldest" ? "قدیمی‌ترین" : publicRoomSort === "most_users" ? "بیشترین کاربران" : publicRoomSort === "least_users" ? "کمترین کاربران" : "نام اتاق"}</span>
                    <IoChevronDownOutline aria-hidden="true" />
                  </button>

                  {isPublicRoomSortOpen && (
                    <div className="join-page__public-rooms__sort__menu" role="listbox" aria-label="مرتب‌سازی اتاق‌ها">
                      {[
                        ["newest", "جدیدترین"],
                        ["oldest", "قدیمی‌ترین"],
                        ["most_users", "بیشترین کاربران"],
                        ["least_users", "کمترین کاربران"],
                        ["name", "نام اتاق"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="option"
                          aria-selected={publicRoomSort === value}
                          className={clsx(
                            "join-page__public-rooms__sort__option",
                            publicRoomSort === value && "is-active",
                          )}
                          onClick={() => {
                            setPublicRoomSort(value as PublicRoomSort);
                            setIsPublicRoomSortOpen(false);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {publicRoomsQuery.isLoading ? (
                <div className="join-page__public-rooms__grid" aria-busy="true">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <article key={index} className="join-page__public-room-card join-page__public-room-card--skeleton">
                      <div className="join-page__public-room-card__title-row">
                        <Skeleton variant="text" width={index % 2 === 0 ? 128 : 96} height={18} />
                      </div>
                      <div className="join-page__public-room-card__image">
                        <Skeleton variant="rect" width="100%" height="100%" radius={16} />
                      </div>
                      <div className="join-page__public-room-card__meta">
                        <Skeleton variant="text" width={110} height={16} />
                      </div>
                      <div className="join-page__public-room-card__code">
                        <span>کد اتاق</span>
                        <Skeleton variant="text" width={58} height={18} />
                      </div>
                      <Skeleton variant="rect" width="100%" height={42} radius={12} />
                    </article>
                  ))}
                </div>
              ) : publicRoomsQuery.error ? (
                <div className="join-page__public-rooms__empty">بارگذاری اتاق‌های عمومی با خطا مواجه شد.</div>
              ) : publicRoomsQuery.data?.rooms?.length ? (
                <>
                  <div className="join-page__public-rooms__grid">
                    {publicRoomsQuery.data.rooms.map((room: PublicRoomResponse) => (
                      <article key={room.id} className="join-page__public-room-card">
                        <div className="join-page__public-room-card__title-row">
                          <h3>{room.name}</h3>
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
                        <div className="join-page__public-room-card__meta">
                          <span>سازنده: {room.creator_username}</span>
                          <span>{room.member_count.toLocaleString("fa-IR")} نفر</span>
                        </div>
                        <div className="join-page__public-room-card__code">
                          <span>کد اتاق</span>
                          <code>{room.code.toLocaleString("fa-IR").replace("٬", "")}</code>
                        </div>
                        <button
                          type="button"
                          className="join-page__public-room-card__join"
                          disabled={paidLocked || joinRoomMutation.isPending}
                          onClick={() => joinRoomMutation.mutate(room.code)}
                        >
                          {joinRoomMutation.isPending ? "در حال ورود..." : "پیوستن"}
                        </button>
                      </article>
                    ))}
                  </div>

                  {publicRoomsQuery.data.total_pages > 1 && (
                    <div className="join-page__public-rooms__pagination" aria-label="صفحات اتاق‌های عمومی">
                      <button
                        type="button"
                        className="join-page__public-rooms__pagination__nav"
                        disabled={publicRoomPage <= 1}
                        aria-label="صفحه قبلی"
                        onClick={() => setPublicRoomPage((page) => Math.max(1, page - 1))}
                      >
                        <IoChevronForwardOutline aria-hidden="true" />
                      </button>

                      {Array.from({ length: publicRoomsQuery.data.total_pages }, (_, index) => index + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={clsx(
                            "join-page__public-rooms__pagination__page",
                            page === publicRoomPage && "is-active",
                          )}
                          aria-current={page === publicRoomPage ? "page" : undefined}
                          onClick={() => setPublicRoomPage(page)}
                        >
                          {page.toLocaleString("fa-IR")}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="join-page__public-rooms__pagination__nav"
                        disabled={publicRoomPage >= publicRoomsQuery.data.total_pages}
                        aria-label="صفحه بعدی"
                        onClick={() => setPublicRoomPage((page) => Math.min(publicRoomsQuery.data!.total_pages, page + 1))}
                      >
                        <IoChevronBackOutline aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="join-page__public-rooms__empty">
                  {submittedPublicRoomSearch ? "اتاقی با این جست‌وجو پیدا نشد." : "در حال حاضر اتاق عمومی فعالی وجود ندارد."}
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

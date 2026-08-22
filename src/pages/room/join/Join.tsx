import { BsPlusLg } from 'react-icons/bs';
import Header from '../../../components/header/Header';
import './Join.scss';
import { IoCopyOutline } from 'react-icons/io5';
import { PiFilmSlateFill, PiUsersThreeFill, PiClockCounterClockwiseFill, PiPlayFill } from 'react-icons/pi';
import CreateRoomModal from './createRoomModal/CreateRoomModal';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getCurrentRoom, getLastActiveRoom, getRoomApiErrorStatus, joinRoom } from '../../../apiCalls/roomApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FaCheck } from 'react-icons/fa6';
import clsx from 'clsx';


const Join = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState<number | string>("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const nav = useNavigate();

  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) {
      nav('/');
    }
  }, [isAuthenticated])


  const currentRoomQuery = useQuery({
    queryKey: ["current-room"],
    queryFn: getCurrentRoom,
    retry: (failureCount, error) => {
      const status = getRoomApiErrorStatus(error);
      return status !== 404 && status !== 410 && failureCount < 2;
    },
  });

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
      setJoinError(null);
      nav(`/room/${data.id}`);
    },
    onError: (error) => {
      if (getRoomApiErrorStatus(error) === 409) {
        setJoinError("شما در حال حاضر در یک اتاق دیگر هستید. ابتدا از آن اتاق خارج شوید و سپس دوباره تلاش کنید.");
        return;
      }
      setJoinError("پیوستن به اتاق با خطا مواجه شد. کد اتاق را بررسی کنید و دوباره تلاش کنید.");
      console.error("Failed to join room:", error);
    },
  });

  const joinLastRoomMutation = useMutation({
    mutationFn: (roomCode: number) => joinRoom(roomCode),
    onSuccess: (data) => {
      setJoinError(null);
      nav(`/room/${data.id}`);
    },
    onError: (error) => {
      if (getRoomApiErrorStatus(error) === 409) {
        setJoinError("شما در حال حاضر در یک اتاق دیگر هستید. ابتدا از آن اتاق خارج شوید و سپس دوباره تلاش کنید.");
        return;
      }
      setJoinError("بازگشت به اتاق با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
      console.error("Failed to join last active room:", error);
    },
  });

  const handleJoin = () => {
    const roomCode = Number(code);
    if (!Number.isInteger(roomCode) || roomCode <= 0 || joinRoomMutation.isPending) return;

    setJoinError(null);
    joinRoomMutation.mutate(roomCode);
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
  const activeRoomLoading = currentRoomQuery.isLoading || currentRoomQuery.isFetching;
  const activeRoomLookupFailed = !!currentRoomQuery.error && getRoomApiErrorStatus(currentRoomQuery.error) !== 404;
  const createRoomDisabled = activeRoomLoading || !!activeRoom || activeRoomLookupFailed;
  const lastRoom = lastRoomQuery.data ?? null;
  const lastRoomLabel = lastRoom?.created_by_name || "آخرین اتاق شما";

  useEffect(() => {
    if (activeRoom) setIsModalOpen(false);
  }, [activeRoom]);

  return (
    <div className='join-page'>
      <Header />
      {joinError && (
        <div className="join-page__error" role="alert">
          <div>
            <strong>امکان ورود نیست</strong>
            <span>{joinError}</span>
          </div>
          <button type="button" onClick={() => setJoinError(null)} aria-label="بستن پیام">
            ×
          </button>
        </div>
      )}

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

                <h4>اتاق شخصی</h4>

                <div className="join-page__content__main__cards__card__i">
                  <span className="join-page__content__main__cards__card__i__screen" aria-hidden="true">
                    <PiPlayFill />
                  </span>
                </div>

                <div className={clsx("join-page__content__main__cards__card__code", copied && 'copied')}>
                  کد شما: {activeRoom ? activeRoom.code.toLocaleString("fa-IR").replace('٬', " ") : "---"}
                  <span
                    onClick={handleCopy}
                    aria-hidden={!activeRoom}
                  >
                    {
                      copied ? (
                        <FaCheck />
                      )
                        : (
                          <IoCopyOutline />
                        )
                    }
                  </span>
                </div>

                <button
                  className="join-page__content__main__cards__card__enter"
                  disabled={!activeRoom || activeRoomLoading}
                  onClick={() => activeRoom && nav(`/room/${activeRoom.id}`)}
                >
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
                    {lastRoom ? lastRoomLabel : "اتاقی برای بازگشت وجود ندارد"}
                    {lastRoom && (
                      <span className="join-page__content__main__cards__last__info__code">
                        {lastRoom.code.toLocaleString("fa-IR").replace('٬', " ")}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  className="join-page__content__main__cards__last__action"
                  type="button"
                  disabled={!lastRoom || joinLastRoomMutation.isPending || lastRoomQuery.isLoading}
                  onClick={() => lastRoom && joinLastRoomMutation.mutate(lastRoom.code)}
                >
                  {joinLastRoomMutation.isPending ? "در حال ورود..." : "بازگشت به اتاق"}
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

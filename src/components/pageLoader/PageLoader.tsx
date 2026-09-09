import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import "./PageLoader.scss";

const MIN_DISPLAY_MS = 640;
const EXIT_DURATION_MS = 420;
const ASSET_TIMEOUT_MS = 7000;

const isRoomPath = (pathname: string) => pathname.startsWith("/room/");

const waitForVisualAssets = async () => {
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

  const images = Array.from(document.images);
  let timeoutId: number | null = null;

  await Promise.race([
    Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      ...images.map(
        (image) =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
              const done = () => {
                image.removeEventListener("load", done);
                image.removeEventListener("error", done);
                resolve();
              };

              image.addEventListener("load", done, { once: true });
              image.addEventListener("error", done, { once: true });
            }),
      ),
    ]),
    new Promise<void>((resolve) => {
      timeoutId = window.setTimeout(resolve, ASSET_TIMEOUT_MS);
    }),
  ]);

  if (timeoutId !== null) window.clearTimeout(timeoutId);
};

const PageLoader = () => {
  const location = useLocation();
  const { isLoading: isAuthLoading } = useAuth();
  const isFetching = useIsFetching({
    predicate: (query) => query.queryKey[0] !== "websiteAnnouncements",
  });

  const isRoom = isRoomPath(location.pathname);
  const previousPathRef = useRef<string>(location.pathname);
  const wasRoom = isRoomPath(previousPathRef.current);
  const isLeavingRoom = wasRoom && !isRoom;

  const [initialLoadVisible, setInitialLoadVisible] = useState(true);
  const [roomExitVisible, setRoomExitVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startedAtRef = useRef<number>(performance.now());
  const finishTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const initialCompleteRef = useRef(false);
  const roomExitActiveRef = useRef(false);
  const routeIdRef = useRef(0);

  const clearTimers = () => {
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  };

  useEffect(() => {
    // Keep the previous room path latched until the room-exit loader has
    // finished. This prevents a later query-state render from losing the
    // transition while the destination page is still fetching.
    if (!isRoom && !roomExitActiveRef.current) {
      previousPathRef.current = location.pathname;
    }
  }, [isRoom, location.pathname]);

  useEffect(() => {
    if (!initialCompleteRef.current) {
      startedAtRef.current = performance.now();
      routeIdRef.current += 1;
    }
  }, []);

  useEffect(() => {
    if (initialCompleteRef.current) return;
    if (isAuthLoading || isFetching > 0) return;

    const routeId = routeIdRef.current;
    const elapsed = performance.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const complete = async () => {
      await waitForVisualAssets();
      if (routeId !== routeIdRef.current || isAuthLoading || isFetching > 0) return;

      setIsExiting(true);
      exitTimerRef.current = window.setTimeout(() => {
        initialCompleteRef.current = true;
        setInitialLoadVisible(false);
        setIsExiting(false);
        exitTimerRef.current = null;
      }, EXIT_DURATION_MS);
    };

    finishTimerRef.current = window.setTimeout(() => {
      finishTimerRef.current = null;
      void complete();
    }, remaining);

    return clearTimers;
  }, [isAuthLoading, isFetching]);

  useEffect(() => {
    if (isLeavingRoom) roomExitActiveRef.current = true;
    if (!roomExitActiveRef.current || !initialCompleteRef.current || isRoom) return;

    clearTimers();
    routeIdRef.current += 1;
    const routeId = routeIdRef.current;
    startedAtRef.current = performance.now();
    setIsExiting(false);
    setRoomExitVisible(true);

    const waitForRoute = async () => {
      if (isAuthLoading || isFetching > 0) return;
      const elapsed = performance.now() - startedAtRef.current;
      const remaining = Math.max(0, Math.min(420, MIN_DISPLAY_MS) - elapsed);
      finishTimerRef.current = window.setTimeout(async () => {
        await waitForVisualAssets();
        if (routeId !== routeIdRef.current || isFetching > 0 || isAuthLoading) return;
        setIsExiting(true);
        exitTimerRef.current = window.setTimeout(() => {
          if (routeId !== routeIdRef.current) return;
          setRoomExitVisible(false);
          roomExitActiveRef.current = false;
          previousPathRef.current = location.pathname;
          setIsExiting(false);
          exitTimerRef.current = null;
        }, EXIT_DURATION_MS);
      }, remaining);
    };

    void waitForRoute();
    return clearTimers;
  }, [isLeavingRoom, isAuthLoading, isFetching]);

  useEffect(() => clearTimers, []);

  const showLoader = initialLoadVisible || roomExitVisible || isLeavingRoom;

  if (isRoom && !initialLoadVisible) return null;
  if (!showLoader) return null;

  return (
    <div
      className={`page-loader${isExiting ? " page-loader--exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="در حال آماده‌سازی صفحه"
    >
      <div className="page-loader__noise" aria-hidden="true" />
      <div className="page-loader__ambient page-loader__ambient--one" aria-hidden="true" />
      <div className="page-loader__ambient page-loader__ambient--two" aria-hidden="true" />
      <div className="page-loader__vignette" aria-hidden="true" />

      <div className="page-loader__content">
        <div className="page-loader__brand" aria-hidden="true">
          <span className="page-loader__brand-line" />
          <span>HAMNAMA</span>
          <span className="page-loader__brand-line" />
        </div>

        <div className="page-loader__aperture" aria-hidden="true">
          <div className="page-loader__aperture__halo" />
          <div className="page-loader__aperture__ring page-loader__aperture__ring--outer" />
          <div className="page-loader__aperture__ring page-loader__aperture__ring--inner" />
          <div className="page-loader__aperture__core"><span /></div>
        </div>

        <div className="page-loader__frame" aria-hidden="true">
          <div className="page-loader__frame__edge" />
          <div className="page-loader__frame__window page-loader__frame__window--one"><span /></div>
          <div className="page-loader__frame__window page-loader__frame__window--two"><span /></div>
          <div className="page-loader__frame__window page-loader__frame__window--three"><span /></div>
          <div className="page-loader__frame__scan" />
        </div>

        <div className="page-loader__copy">
          <span className="page-loader__copy__eyebrow">PREPARING THE NEXT SCENE</span>
          <h1>در حال آماده‌سازی<span className="page-loader__copy__dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></h1>
          <p>صحنه را آماده می‌کنیم تا همه‌چیز درست همان‌طور که باید نمایش داده شود.</p>
        </div>

        <div className="page-loader__status" aria-hidden="true">
          <div className="page-loader__status__rail"><span /></div>
          <div className="page-loader__status__meta">
            <span>PLEASE WAIT</span>
            <span className="page-loader__status__dots"><i /><i /><i /></span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PageLoader;

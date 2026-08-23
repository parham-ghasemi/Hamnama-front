import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiBell, FiCheck, FiX } from "react-icons/fi";

import { getWebsiteAnnouncements, type WebsiteAnnouncement } from "../../apiCalls/announcementApi";
import "./WebsiteAnnouncements.scss";

const STORAGE_KEY = "hamnama.websiteAnnouncements.seen";
const CLOSE_DELAY = 280;

function readSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

function writeSeenIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage can be unavailable in privacy-restricted environments.
  }
}

function isExcludedPath(pathname: string) {
  return pathname.startsWith("/room/") || pathname === "/admin" || pathname.startsWith("/admin/");
}

const WebsiteAnnouncements = () => {
  const location = useLocation();
  const [activeAnnouncement, setActiveAnnouncement] = useState<WebsiteAnnouncement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => readSeenIds());
  const routeKeyRef = useRef(location.pathname);
  const closingTimerRef = useRef<number | null>(null);

  const announcementsQuery = useQuery({
    queryKey: ["websiteAnnouncements", location.pathname],
    queryFn: getWebsiteAnnouncements,
    staleTime: 0,
    enabled: !isExcludedPath(location.pathname),
    refetchOnWindowFocus: false,
  });

  const orderedAnnouncements = useMemo(() => {
    return [...(announcementsQuery.data?.announcements ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [announcementsQuery.data?.announcements]);

  useEffect(() => {
    return () => {
      if (closingTimerRef.current !== null) {
        window.clearTimeout(closingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (routeKeyRef.current === location.pathname) return;
    routeKeyRef.current = location.pathname;

    if (isExcludedPath(location.pathname)) {
      setIsVisible(false);
      setActiveAnnouncement(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isExcludedPath(location.pathname) || announcementsQuery.isLoading || announcementsQuery.isError) {
      return;
    }

    if (activeAnnouncement) return;

    const next = orderedAnnouncements.find((announcement) => !seenIds.has(announcement.id));
    if (!next) return;

    const nextSeenIds = new Set(seenIds);
    nextSeenIds.add(next.id);
    setSeenIds(nextSeenIds);
    writeSeenIds(nextSeenIds);
    setActiveAnnouncement(next);

    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, [activeAnnouncement, announcementsQuery.isError, announcementsQuery.isLoading, location.pathname, orderedAnnouncements, seenIds]);

  const closeAnnouncement = () => {
    setIsVisible(false);

    if (closingTimerRef.current !== null) {
      window.clearTimeout(closingTimerRef.current);
    }

    closingTimerRef.current = window.setTimeout(() => {
      setActiveAnnouncement(null);
      closingTimerRef.current = null;
    }, CLOSE_DELAY);
  };

  if (!activeAnnouncement || isExcludedPath(location.pathname)) {
    return null;
  }

  return (
    <div className={`website-announcement ${isVisible ? "is-visible" : ""}`} role="dialog" aria-modal="true" aria-label="اعلان سایت">
      <button
        type="button"
        className="website-announcement__backdrop"
        aria-label="بستن اعلان"
        onClick={closeAnnouncement}
      />

      <section className="website-announcement__card">
        <div className="website-announcement__accent" aria-hidden="true" />

        <button
          type="button"
          className="website-announcement__close"
          onClick={closeAnnouncement}
          aria-label="بستن"
        >
          <FiX aria-hidden="true" />
        </button>

        <div className="website-announcement__header">
          <div className="website-announcement__icon" aria-hidden="true">
            <span className="website-announcement__icon-ring" />
            <FiBell />
          </div>

          <div>
            <p className="website-announcement__eyebrow">اطلاعیه</p>
            <h2>یک خبر جدید برای شما</h2>
          </div>
        </div>

        <div className="website-announcement__divider" aria-hidden="true" />

        <p className="website-announcement__message">{activeAnnouncement.message}</p>

        <div className="website-announcement__footer">
          <span className="website-announcement__meta">
            <span className="website-announcement__status-dot" aria-hidden="true" />
            تازه منتشر شده
          </span>

          <button type="button" className="website-announcement__confirm" onClick={closeAnnouncement}>
            <span>متوجه شدم</span>
            <FiCheck aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default WebsiteAnnouncements;

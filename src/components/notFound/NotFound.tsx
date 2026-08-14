import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { PiHouseFill, PiArrowUUpLeftBold, PiPlayFill } from "react-icons/pi";
import FilmStrip404 from "./FilmStrip404";
import "./NotFound.scss";

type NotFoundProps = {
  className?: string;
  /** Optional router-aware handlers. Falls back to plain browser navigation. */
  onHome?: () => void;
  onBack?: () => void;
  onWatch?: () => void;
};

/**
 * 404 page.
 *
 * Interactive bits, all optional and all disabled for reduced-motion users:
 *  - the whole "reel" tilts slightly toward the pointer (3D parallax)
 *  - a projector spotlight follows the cursor across the card
 *  - the film strip flickers on load, like a projector warming up
 */
const NotFound = ({ className, onHome, onBack, onWatch }: NotFoundProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const canAnimate = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!canAnimate.matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      targetX = Math.max(-1, Math.min(1, (px - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, (py - 0.5) * 2));
      card.style.setProperty("--nf-spot-x", `${px * 100}%`);
      card.style.setProperty("--nf-spot-y", `${py * 100}%`);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      card.style.setProperty("--nf-spot-x", "50%");
      card.style.setProperty("--nf-spot-y", "0%");
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      card.style.setProperty("--nf-tilt-x", `${(-currentY * 6).toFixed(3)}deg`);
      card.style.setProperty("--nf-tilt-y", `${(currentX * 8).toFixed(3)}deg`);
      card.style.setProperty("--nf-shift", `${(currentX * 10).toFixed(2)}px`);
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const go = (handler: (() => void) | undefined, href: string) => () => {
    if (handler) handler();
    else window.location.assign(href);
  };

  const back = () => {
    if (onBack) onBack();
    else if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  };

  return (
    <div className={clsx("not-found", ready && "not-found--ready", className)}>
      <div className="not-found__grain" aria-hidden="true" />
      <div className="not-found__blob not-found__blob--one" aria-hidden="true" />
      <div className="not-found__blob not-found__blob--two" aria-hidden="true" />

      <div className="not-found__card" ref={cardRef}>
        <div className="not-found__spot" aria-hidden="true" />

        <div className="not-found__mark">
          <FilmStrip404 />
          <span className="not-found__mark__glow" aria-hidden="true" />
        </div>

        <h1 className="not-found__title">
          این <span>صحنه</span> حذف شده!
        </h1>

        <p className="not-found__subtitle">
          صفحه‌ای که دنبالش بودید روی پرده نیست؛ شاید آدرس اشتباه تایپ شده یا
          این قسمت از فیلم دیگر پخش نمی‌شود.
        </p>

        <div className="not-found__actions">
          <button
            type="button"
            className="not-found__actions__primary"
            onClick={go(onHome, "/")}
          >
            <span className="not-found__actions__icon" aria-hidden="true">
              <PiHouseFill />
            </span>
            <span className="not-found__actions__label">بازگشت به خانه</span>
            <span className="not-found__actions__sheen" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="not-found__actions__ghost"
            onClick={back}
          >
            <span className="not-found__actions__icon" aria-hidden="true">
              <PiArrowUUpLeftBold />
            </span>
            <span className="not-found__actions__label">صفحه قبل</span>
          </button>

          <button
            type="button"
            className="not-found__actions__ghost"
            onClick={go(onWatch, "/join-room")}
          >
            <span className="not-found__actions__icon" aria-hidden="true">
              <PiPlayFill />
            </span>
            <span className="not-found__actions__label">شروع به تماشا</span>
          </button>
        </div>

        <div className="not-found__code" aria-hidden="true">
          <span className="not-found__code__dot" />
          ERROR 404 — SCENE NOT FOUND
        </div>
      </div>
    </div>
  );
};

export default NotFound;

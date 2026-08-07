import { useEffect, useRef } from "react";
import "./CinemaAmbience.scss";

/**
 * Decorative, non-interactive atmosphere layer for the home page.
 *
 * Three stacked pieces, all behind the content:
 *  1. a fixed warm "projector" wash + vignette (pure CSS, always on)
 *  2. a soft light that drifts toward the cursor, like a house light
 *  3. a faint film-strip that trails further behind the cursor
 *
 * Motion runs in a single rAF loop and only ever writes `transform`, so it
 * stays on the compositor. It is skipped entirely for reduced-motion users,
 * coarse pointers (touch) and small screens.
 */
const CinemaAmbience = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const spot = spotRef.current;
    const strip = stripRef.current;
    const root = rootRef.current;
    if (!spot || !strip || !root) return;

    const canAnimate = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    );

    let frame = 0;
    let detach: (() => void) | undefined;

    const start = () => {
      root.classList.add("cinema-ambience--active");

      // Target = cursor, current = eased position. Two different lags give
      // the strip its lazy, trailing feel without any extra listeners.
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let spotX = targetX;
      let spotY = targetY;
      let stripX = targetX;
      let stripY = targetY;

      const onMove = (event: PointerEvent) => {
        targetX = event.clientX;
        targetY = event.clientY;
      };

      const tick = () => {
        spotX += (targetX - spotX) * 0.075;
        spotY += (targetY - spotY) * 0.075;
        stripX += (targetX - stripX) * 0.028;
        stripY += (targetY - stripY) * 0.028;

        spot.style.transform = `translate3d(${spotX}px, ${spotY}px, 0) translate(-50%, -50%)`;
        strip.style.transform = `translate3d(${stripX}px, ${stripY}px, 0) translate(-50%, -50%) rotate(${(stripX - spotX) * 0.06
          }deg)`;

        frame = requestAnimationFrame(tick);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      frame = requestAnimationFrame(tick);

      detach = () => {
        window.removeEventListener("pointermove", onMove);
        cancelAnimationFrame(frame);
        root.classList.remove("cinema-ambience--active");
      };
    };

    const sync = () => {
      detach?.();
      detach = undefined;
      if (canAnimate.matches) start();
    };

    sync();
    canAnimate.addEventListener("change", sync);

    return () => {
      canAnimate.removeEventListener("change", sync);
      detach?.();
    };
  }, []);

  return (
    <div className="cinema-ambience" ref={rootRef} aria-hidden="true">
      <div className="cinema-ambience__wash" />
      <div className="cinema-ambience__grain" />
      <div className="cinema-ambience__vignette" />

      <div className="cinema-ambience__spot" ref={spotRef} />

      <div className="cinema-ambience__strip" ref={stripRef}>
        <svg viewBox="0 0 120 300" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="120" height="300" rx="10" className="strip-body" />
          {Array.from({ length: 10 }).map((_, i) => (
            <g key={i}>
              <rect x="9" y={12 + i * 29} width="12" height="16" rx="3" className="strip-hole" />
              <rect x="99" y={12 + i * 29} width="12" height="16" rx="3" className="strip-hole" />
            </g>
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <rect
              key={`f-${i}`}
              x="28"
              y={14 + i * 58}
              width="64"
              height="50"
              rx="4"
              className="strip-frame"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default CinemaAmbience;

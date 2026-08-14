import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import ToastIcon from "./ToastIcons";
import {
  autoClose,
  resolveDuration,
  subscribeToToasts,
  toast,
  type ToastId,
  type ToastRecord,
} from "./toast";
import "./Toaster.scss";

export type ToasterPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

type ToasterProps = {
  position?: ToasterPosition;
  /** Extra toasts beyond this are stacked behind the front ones. */
  visibleToasts?: number;
  dir?: "rtl" | "ltr";
  className?: string;
};

/**
 * Mount once, near the root:  <Toaster />
 *
 * Behaviour mirrors sonner: newest first, hover to pause the timers, a
 * progress hairline per toast, swipe/drag to dismiss, and a collapsed stack
 * that expands on hover.
 */
const Toaster = ({
  position = "bottom-left",
  visibleToasts = 4,
  dir = "rtl",
  className,
}: ToasterProps) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => subscribeToToasts(setToasts), []);

  const isTop = position.startsWith("top");
  const shown = toasts.slice(0, visibleToasts + 2);

  return (
    <ol
      className={clsx("cn-toaster", `cn-toaster--${position}`, className)}
      dir={dir}
      aria-live="polite"
      aria-label="اعلان‌ها"
      onPointerEnter={() => setExpanded(true)}
      onPointerLeave={() => setExpanded(false)}
    >
      {shown.map((record, index) => (
        <ToastItem
          key={record.id}
          record={record}
          index={index}
          isTop={isTop}
          expanded={expanded}
          hidden={index >= visibleToasts}
        />
      ))}
    </ol>
  );
};

type ToastItemProps = {
  record: ToastRecord;
  index: number;
  isTop: boolean;
  expanded: boolean;
  hidden: boolean;
};

const EXIT_MS = 250;

const ToastItem = ({ record, index, isTop, expanded, hidden }: ToastItemProps) => {
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const elementRef = useRef<HTMLLIElement | null>(null);
  const dragRef = useRef<{ startX: number; pointerId: number } | null>(null);

  const duration = resolveDuration(record);

  const close = useCallback(
    (viaTimer: boolean) => {
      if (leaving) return;
      setLeaving(true);
      window.setTimeout(() => {
        if (viaTimer) autoClose(record.id);
        else toast.dismiss(record.id);
      }, EXIT_MS);
    },
    [leaving, record.id],
  );

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Type changes (e.g. loading -> success via toast.promise) restart the timer.
  useEffect(() => {
    setLeaving(false);
  }, [record.type]);

  useEffect(() => {
    if (!Number.isFinite(duration)) return;
    if (expanded) return; // hovering the stack pauses everything, like sonner
    const id = window.setTimeout(() => close(true), duration);
    return () => window.clearTimeout(id);
  }, [duration, expanded, close, record.type, record.title]);

  const onPointerDown = (event: React.PointerEvent<HTMLLIElement>) => {
    if (record.dismissible === false) return;
    if ((event.target as HTMLElement).closest("button")) return;
    dragRef.current = { startX: event.clientX, pointerId: event.pointerId };
    elementRef.current?.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLLIElement>) => {
    if (!dragRef.current) return;
    setSwipe(event.clientX - dragRef.current.startX);
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (Math.abs(swipe) > 90) close(false);
    else setSwipe(0);
  };

  const depth = Math.min(index, 3);

  const style = {
    "--cn-index": index,
    "--cn-depth": depth,
    "--cn-swipe": `${swipe}px`,
    "--cn-duration": Number.isFinite(duration) ? `${duration}ms` : "0ms",
  } as React.CSSProperties;

  return (
    <li
      ref={elementRef}
      className={clsx(
        "cn-toast",
        `cn-toast--${record.type}`,
        isTop ? "cn-toast--from-top" : "cn-toast--from-bottom",
        mounted && "cn-toast--in",
        leaving && "cn-toast--out",
        expanded && "cn-toast--expanded",
        hidden && "cn-toast--hidden",
        swipe !== 0 && "cn-toast--dragging",
      )}
      style={style}
      role={record.type === "error" ? "alert" : "status"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="cn-toast__glow" aria-hidden="true" />
      <span className="cn-toast__rail" aria-hidden="true" />

      {record.render ? (
        <div className="cn-toast__custom">{record.render(record.id)}</div>
      ) : (
        <>
          <span className="cn-toast__icon">
            {record.icon ?? <ToastIcon type={record.type} />}
          </span>

          <div className="cn-toast__body">
            <p className="cn-toast__title">{record.title}</p>
            {record.description ? (
              <p className="cn-toast__description">{record.description}</p>
            ) : null}

            {record.action || record.cancel ? (
              <div className="cn-toast__buttons">
                {record.action ? (
                  <button
                    type="button"
                    className="cn-toast__buttons__action"
                    onClick={() => {
                      record.action?.onClick(record.id);
                      close(false);
                    }}
                  >
                    {record.action.label}
                  </button>
                ) : null}
                {record.cancel ? (
                  <button
                    type="button"
                    className="cn-toast__buttons__cancel"
                    onClick={() => {
                      record.cancel?.onClick(record.id);
                      close(false);
                    }}
                  >
                    {record.cancel.label}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      )}

      {record.dismissible === false ? null : (
        <button
          type="button"
          className="cn-toast__close"
          aria-label="بستن اعلان"
          onClick={() => close(false)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 7l10 10M17 7L7 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {Number.isFinite(duration) ? (
        <span
          className={clsx(
            "cn-toast__progress",
            expanded && "cn-toast__progress--paused",
          )}
          aria-hidden="true"
        />
      ) : null}
    </li>
  );
};

export default Toaster;
export type { ToastId };
export { toast };

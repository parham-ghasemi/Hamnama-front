/**
 * Custom cinema-flavoured status marks for the toast component.
 *
 * They are inline SVGs (not react-icons) so each one can carry its own small
 * draw-in animation, and they inherit `currentColor` so light/dark and the
 * per-type accent colour come for free.
 */
import type { ReactElement, ReactNode } from "react";
import type { ToastType } from "./toast";

const wrap = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

/** A clapperboard whose arm snaps shut. */
const SuccessMark = () =>
  wrap(
    <>
      <rect
        x="3"
        y="9.5"
        width="18"
        height="11"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        className="cn-toast-icon__clap"
        d="M3.6 9 5 5.2l16.2 1.6-1 3.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        className="cn-toast-icon__check"
        d="M8.4 15.2l2.6 2.6 4.8-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  );

/** A torn film frame. */
const ErrorMark = () =>
  wrap(
    <>
      <rect
        x="3.2"
        y="4.2"
        width="17.6"
        height="15.6"
        rx="2.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 4.6v14.8M17 4.6v14.8"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.45"
        strokeDasharray="2 2.6"
      />
      <path
        className="cn-toast-icon__x"
        d="M9.8 9.8l4.4 4.4M14.2 9.8l-4.4 4.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>,
  );

/** A projector beam with a warning bang. */
const WarningMark = () =>
  wrap(
    <>
      <path
        d="M12 3.6l9 15.2a1.4 1.4 0 01-1.2 2.1H4.2A1.4 1.4 0 013 18.8L12 3.6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        className="cn-toast-icon__bang"
        d="M12 9.4v4.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle className="cn-toast-icon__bang" cx="12" cy="17" r="1.15" fill="currentColor" />
    </>,
  );

/** A ticket stub. */
const InfoMark = () =>
  wrap(
    <>
      <path
        d="M3.4 8.4V6.6A1.4 1.4 0 014.8 5.2h14.4a1.4 1.4 0 011.4 1.4v1.8a2.2 2.2 0 000 7.2v1.8a1.4 1.4 0 01-1.4 1.4H4.8a1.4 1.4 0 01-1.4-1.4v-1.8a2.2 2.2 0 000-7.2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        className="cn-toast-icon__bang"
        d="M12 11.2v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle className="cn-toast-icon__bang" cx="12" cy="8.6" r="1.1" fill="currentColor" />
    </>,
  );

/** A film reel that spins while work is in flight. */
const LoadingMark = () =>
  wrap(
    <g className="cn-toast-icon__reel">
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="7.4" r="1.5" fill="currentColor" opacity="0.85" />
      <circle cx="16" cy="14.3" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="8" cy="14.3" r="1.5" fill="currentColor" opacity="0.35" />
    </g>,
  );

/** Default: a small play badge. */
const DefaultMark = () =>
  wrap(
    <>
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.8" />
      <path
        className="cn-toast-icon__play"
        d="M10.4 8.8l5.2 3.2-5.2 3.2z"
        fill="currentColor"
      />
    </>,
  );

const marks: Record<ToastType, () => ReactElement> = {
  success: SuccessMark,
  error: ErrorMark,
  warning: WarningMark,
  info: InfoMark,
  loading: LoadingMark,
  default: DefaultMark,
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const Mark = marks[type] ?? DefaultMark;
  return (
    <span className={`cn-toast-icon cn-toast-icon--${type}`}>
      <Mark />
    </span>
  );
};

export default ToastIcon;
